// ==UserScript==
// @name         Miniflux 文章剪藏到思源笔记
// @namespace    http://tampermonkey.net/
// @version      2.1.1
// @description  在Miniflux页面上添加按钮，将文章一键剪藏到思源笔记。请在设置中配置你的Miniflux和思源信息。
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest      // 授权：使用 Tampermonkey 的特权网络请求 API，可绕过网页的跨域限制 (CSP)。
// @grant        GM_getValue           // 授权：从 Tampermonkey 的本地存储中读取数据。
// @grant        GM_setValue           // 授权：向 Tampermonkey 的本地存储中写入数据。
// @grant        GM_registerMenuCommand // 授权：在 Tampermonkey 的菜单中注册一个自定义命令。
// @grant        GM_addStyle           // 授权：向页面注入 CSS 样式。
// @require      https://cdn.jsdelivr.net/npm/turndown@7.1.2/dist/turndown.js // 依赖：在脚本运行前，从 CDN 加载 Turndown.js 库，用于专业的 HTML 到 Markdown 转换。
// ==/UserScript==

// 使用立即执行函数表达式 (IIFE) 来创建一个独立的作用域。
// 这可以避免脚本中的变量和函数与网页自身的代码发生冲突。
(function() {
    'use strict'; // 启用严格模式，这能帮助捕获一些常见的编码错误，并使代码更安全。

    // ===== 1. 配置管理模块 =====
    // 这个模块负责所有与用户配置相关的操作，包括读取、保存和验证。
    const Config = {
        // 将所有配置项的键名集中管理，方便日后维护和修改。
        keys: {
            minifluxUrl: 'miniflux_url', // 存储用户 Miniflux 地址的键。
            apiUrl: 'siyuan_api_url',      // 存储用户思源 API 地址的键。
            token: 'siyuan_token',         // 存储用户思源 API Token 的键。
            notebookId: 'siyuan_notebook_id' // 存储用户思源笔记本 ID 的键。
        },

        // 从 Tampermonkey 的本地存储中获取所有已保存的配置。
        // GM_getValue 的第二个参数是默认值，如果存储中没有对应项，则返回这个空字符串。
        getAll: function() {
            return {
                minifluxUrl: GM_getValue(this.keys.minifluxUrl, ''),
                apiUrl: GM_getValue(this.keys.apiUrl, ''),
                token: GM_getValue(this.keys.token, ''),
                notebookId: GM_getValue(this.keys.notebookId, '')
            };
        },

        // 将新的配置对象保存到 Tampermonkey 的本地存储中。
        setAll: function(newConfig) {
            GM_setValue(this.keys.minifluxUrl, newConfig.minifluxUrl);
            GM_setValue(this.keys.apiUrl, newConfig.apiUrl);
            GM_setValue(this.keys.token, newConfig.token);
            GM_setValue(this.keys.notebookId, newConfig.notebookId);
        },

        // 检查所有必要的配置项是否都已填写。
        // 这是一个快速验证方法，确保脚本在信息不全时不会尝试执行核心功能。
        isComplete: function() {
            const config = this.getAll();
            // 使用逻辑与，只有当所有配置项都为真值（非空字符串）时，才返回 true。
            return config.minifluxUrl && config.apiUrl && config.token && config.notebookId;
        },

        // 显示一个图形化的设置模态窗口，让用户输入或修改配置。
        showSettings: function() {
            const config = this.getAll();
            
            // 防止重复创建模态窗口。
            if (document.getElementById('siyuan-settings-modal')) return;

            // 使用 GM_addStyle 注入 CSS 样式。
            // 这比直接操作 style 属性或创建 <style> 标签更简洁，并且能自动处理作用域问题。
            GM_addStyle(`
                #siyuan-settings-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 100000; display: flex; justify-content: center; align-items: center; font-family: sans-serif; }
                #siyuan-settings-content { background: #fff; padding: 20px 30px; border-radius: 8px; width: 90%; max-width: 450px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
                #siyuan-settings-content h2 { margin-top: 0; color: #333; }
                #siyuan-settings-content label { display: block; margin-top: 15px; margin-bottom: 5px; font-weight: bold; color: #555; }
                #siyuan-settings-content input { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
                #siyuan-settings-buttons { margin-top: 20px; text-align: right; }
                #siyuan-settings-buttons button { padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; }
                #siyuan-save-btn { background-color: #007AFF; color: white; }
                #siyuan-cancel-btn { background-color: #f0f0f0; color: #333; }
            `);

            // 使用原生 DOM API (createElement, appendChild) 来构建模态窗口。
            // 这是为了兼容现代浏览器的 "Trusted Types" 安全策略，该策略禁止直接使用 innerHTML 插入不受信任的 HTML 字符串。
            const modal = document.createElement('div');
            modal.id = 'siyuan-settings-modal'; // 设置 ID，方便后续查找和防止重复创建。
            const content = document.createElement('div');
            content.id = 'siyuan-settings-content';

            const title = document.createElement('h2');
            title.textContent = '剪藏服务配置'; // 设置窗口标题。
            content.appendChild(title);

            // --- Miniflux 地址输入框 ---
            const minifluxUrlLabel = document.createElement('label');
            minifluxUrlLabel.textContent = 'Miniflux 地址 (如: https://rss.example.com)';
            minifluxUrlLabel.setAttribute('for', 'minifluxUrl'); // 关联 label 和 input，提升可访问性。
            content.appendChild(minifluxUrlLabel);
            const minifluxUrlInput = document.createElement('input');
            minifluxUrlInput.type = 'url'; // 使用 url 类型的输入框，浏览器会进行基础格式验证。
            minifluxUrlInput.id = 'minifluxUrl';
            minifluxUrlInput.placeholder = '请输入你的 Miniflux 服务器地址';
            minifluxUrlInput.value = config.minifluxUrl; // 将已保存的值填入输入框。
            content.appendChild(minifluxUrlInput);

            // --- 思源 API 地址输入框 ---
            const apiUrlLabel = document.createElement('label');
            apiUrlLabel.textContent = '思源 API 地址 (如: https://siyuan.example.com)';
            apiUrlLabel.setAttribute('for', 'apiUrl');
            content.appendChild(apiUrlLabel);
            const apiUrlInput = document.createElement('input');
            apiUrlInput.type = 'url';
            apiUrlInput.id = 'apiUrl';
            apiUrlInput.placeholder = '请输入你的思源服务器地址';
            apiUrlInput.value = config.apiUrl;
            content.appendChild(apiUrlInput);

            // --- API Token 输入框 ---
            const tokenLabel = document.createElement('label');
            tokenLabel.textContent = 'API Token';
            tokenLabel.setAttribute('for', 'token');
            content.appendChild(tokenLabel);
            const tokenInput = document.createElement('input');
            tokenInput.type = 'text'; // Token 是字符串，使用 text 类型。
            tokenInput.id = 'token';
            tokenInput.placeholder = '在思源设置 -> 关于 -> API Token 中生成';
            tokenInput.value = config.token;
            content.appendChild(tokenInput);

            // --- 笔记本 ID 输入框 ---
            const notebookIdLabel = document.createElement('label');
            notebookIdLabel.textContent = '笔记本 ID (如: 20211231123456-abcdefg)';
            notebookIdLabel.setAttribute('for', 'notebookId');
            content.appendChild(notebookIdLabel);
            const notebookIdInput = document.createElement('input');
            notebookIdInput.type = 'text';
            notebookIdInput.id = 'notebookId';
            notebookIdInput.placeholder = '在思源笔记设置 -> 关于 -> 笔记本列表中查找';
            notebookIdInput.value = config.notebookId;
            content.appendChild(notebookIdInput);
            
            // --- 按钮区域 ---
            const buttons = document.createElement('div');
            buttons.id = 'siyuan-settings-buttons';

            // 取消按钮
            const cancelButton = document.createElement('button');
            cancelButton.id = 'siyuan-cancel-btn';
            cancelButton.textContent = '取消';
            // 点击取消按钮时，移除整个模态窗口。
            cancelButton.addEventListener('click', () => modal.remove());
            buttons.appendChild(cancelButton);

            // 保存按钮
            const saveButton = document.createElement('button');
            saveButton.id = 'siyuan-save-btn';
            saveButton.textContent = '保存';
            // 点击保存按钮时，执行保存逻辑。
            saveButton.addEventListener('click', () => {
                const newConfig = {
                    minifluxUrl: minifluxUrlInput.value.trim(), // trim() 移除用户可能误输入的首尾空格。
                    apiUrl: apiUrlInput.value.trim(),
                    token: tokenInput.value.trim(),
                    notebookId: notebookIdInput.value.trim()
                };
                this.setAll(newConfig); // 调用 setAll 方法保存配置。
                modal.remove(); // 关闭模态窗口。
                alert('配置已保存！'); // 给用户一个明确的反馈。
                window.location.reload(); // 刷新页面，让新配置立即生效。
            });
            buttons.appendChild(saveButton);

            content.appendChild(buttons);
            modal.appendChild(content);
            document.body.appendChild(modal); // 将整个模态窗口添加到页面中。

            // 点击模态窗口的背景（非内容区域）时，也可以关闭窗口。
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        }
    };

    // ===== 2. 核心上传模块 =====
    // 这个模块负责整个文章抓取、转换和上传的核心业务逻辑。
    const SiYuanUploader = {
        config: {}, // 初始化一个空对象，用于在 init 函数中填充配置。
        
        // 初始化函数，是模块的入口。
        init: function() {
            this.config = Config.getAll(); // 从 Config 模块获取配置。

            // 1. 检查配置是否完整。
            if (!Config.isComplete()) {
                console.warn('脚本配置不完整，请在菜单中打开设置进行配置。');
                return; // 如果配置不全，则直接退出，不执行后续任何操作。
            }

            // 2. 检查当前页面是否是用户配置的 Miniflux 实例。
            // 这是关键的安全和隔离步骤，确保脚本只在用户的 Miniflux 页面上运行。
            try {
                const currentHost = window.location.hostname; // 获取当前页面的域名，如 "rss.by00s.top"。
                const configuredHost = new URL(this.config.minifluxUrl).hostname; // 从用户配置的完整 URL 中解析出域名。
                if (currentHost !== configuredHost) {
                    // 如果当前域名与配置的域名不匹配，则脚本不执行。
                    // console.log(`当前域名 ${currentHost} 与配置的 Miniflux 域名 ${configuredHost} 不匹配，脚本未启动。`);
                    return;
                }
            } catch (e) {
                // 如果用户配置的 Miniflux 地址格式不正确，new URL() 会抛出异常。
                console.error('Miniflux 地址格式错误:', e);
                return;
            }
            
            console.log(`当前域名匹配，脚本启动。`);

            // 3. 如果配置和域名都正确，则开始创建上传按钮。
            // 使用 document.readyState 来判断页面的加载状态。
            if (document.readyState === 'loading') {
                // 如果页面还在加载中（HTML 文档正在被解析），则等待 'DOMContentLoaded' 事件后再创建按钮。
                // 这确保了我们要找的 DOM 元素（如 .entry-actions ul）已经存在。
                document.addEventListener('DOMContentLoaded', () => this.createUploadButton());
            } else {
                // 如果页面已经加载完成（DOMContentLoaded 事件已经触发），则延迟一小段时间再创建按钮。
                // 这是为了应对某些动态加载内容的单页应用（SPA），给它们留出渲染时间。
                setTimeout(() => this.createUploadButton(), 500);
            }
        },
        
        // 将 GM_xmlhttpRequest 包装成一个返回 Promise 的函数。
        // 这样做是为了使用现代的 async/await 语法，使异步代码更易读、更易维护。
        fetchWithGM: function(details) {
            return new Promise((resolve, reject) => {
                // GM_xmlhttpRequest 的 onload 事件在请求成功时触发。
                details.onload = (res) => {
                    // 检查 HTTP 状态码是否在 2xx 范围内，表示成功。
                    if (res.status >= 200 && res.status < 300) {
                        resolve(res); // 成功则 resolve Promise。
                    } else {
                        // 失败则 reject Promise，并附带错误信息。
                        reject(new Error(`请求失败: ${res.status} ${res.statusText}`));
                    }
                };
                // onerror 事件在网络层面出错时触发（如 DNS 解析失败、跨域等）。
                details.onerror = (err) => reject(err);
                GM_xmlhttpRequest(details); // 发起实际的请求。
            });
        },
        
        // 根据文章标题生成一个安全的文件系统路径。
        generateSafePath: function(title) {
            // 使用正则表达式清理标题，只保留中英文、数字、空格和短横线。
            const safeTitle = title.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
            const timestamp = new Date().toISOString().slice(0, 10); // 获取当前日期，格式为 YYYY-MM-DD。
            return `/web-clips/${timestamp}/${safeTitle}`; // 组合成最终路径。
        },
        
        // 获取文章标题。使用多个选择器来增加脚本的鲁棒性，适应不同版本的 Miniflux 或不同类型的页面。
        getArticleTitle: function() {
            const selectors = ['h1#page-header-title', 'h1.page-header-title', '.entry-title h1', 'article h1', 'main h1', 'h1', 'title'];
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                // 找到第一个存在且内容不为空的元素，就将其作为标题。
                if (element && element.textContent.trim()) {
                    return element.textContent.trim();
                }
            }
            return '无标题文章'; // 如果所有选择器都找不到，则使用默认标题。
        },

        // 获取文章正文内容。同样使用多个选择器。
        getArticleContent: function() {
            const selectors = ['main article.entry-content', '.entry-content', 'article.content', '.content', 'main'];
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    // 使用 cloneNode(true) 复制元素及其所有子元素。
                    // 这样做是为了在不影响原始页面的情况下进行后续的清理和转换操作。
                    return element.cloneNode(true);
                }
            }
            return null;
        },
        
        // 使用 Turndown.js 库将 HTML 元素转换为 Markdown。
        convertToMarkdown: function(element) {
            if (!element) return '';
            // 创建 TurndownService 实例，并配置转换规则。
            const turndownService = new TurndownService({ 
                headingStyle: 'atx',        // 标题风格：使用 # ## ### (ATX style) 而不是下划线。
                codeBlockStyle: 'fenced'    // 代码块风格：使用 ``` ``` 而不是缩进。
            });
            return turndownService.turndown(element); // 执行转换。
        },
        
        // 调用思源笔记的 API 来创建文档。
        createSiYuanDocument: async function(title, markdown) {
            const path = this.generateSafePath(title);
            // 构建思源 API 需要的请求体数据。
            const docData = { notebook: this.config.notebookId, path: path, markdown: markdown };
            
            // 使用我们包装好的 fetchWithGM 函数发送 POST 请求。
            const response = await this.fetchWithGM({
                method: 'POST',
                url: `${this.config.apiUrl}/api/filetree/createDocWithMd`,
                headers: { 
                    'Content-Type': 'application/json', // 告诉服务器我们发送的是 JSON 数据。
                    'Authorization': `Token ${this.config.token}` // 使用 Token 进行身份验证。
                },
                data: JSON.stringify(docData) // 将 JavaScript 对象转换为 JSON 字符串。
            });
            
            const result = JSON.parse(response.responseText); // 解析服务器返回的 JSON 响应。
            // 思源 API 的规范：code 为 0 表示成功，否则表示失败。
            if (result.code !== 0) { 
                throw new Error(`思源API错误: ${result.msg}`); 
            }
            return result.data;
        },
        
        // 主上传函数，协调整个上传流程。
        uploadToSiYuan: async function() {
            const button = document.getElementById('siyuan-upload-btn');
            if (!button) return;

            const originalText = button.textContent; // 保存按钮的原始文本。
            button.disabled = true; // 禁用按钮，防止用户重复点击。
            button.textContent = '上传中...'; // 更新按钮文本，给用户即时反馈。

            try {
                console.log('开始上传到思源');
                const title = this.getArticleTitle(); // 获取标题。
                const content = this.getArticleContent(); // 获取内容。
                
                if (!content) { throw new Error('无法获取文章内容'); } // 基本检查。

                const markdown = this.convertToMarkdown(content); // 转换为 Markdown。
                if (!markdown.trim()) { throw new Error('转换后的内容为空'); } // 基本检查。

                await this.createSiYuanDocument(title, markdown); // 执行上传。

                // 上传成功后的 UI 反馈。
                button.textContent = '成功';
                console.log('上传成功');
                setTimeout(() => { 
                    button.textContent = originalText; // 2秒后恢复按钮原始文本。
                    button.disabled = false;      // 重新启用按钮。
                }, 2000);
            } catch (error) {
                // 捕获并处理上传过程中可能出现的任何错误。
                console.error('上传失败:', error);
                button.textContent = '失败';
                alert(`上传失败: ${error.message}`); // 使用 alert 弹窗显示错误信息，让用户明确知道发生了什么。
                setTimeout(() => { 
                    button.textContent = originalText; // 3秒后恢复按钮原始文本。
                    button.disabled = false;      // 重新启用按钮。
                }, 3000);
            }
        },
        
        // 在页面上创建“上传思源”按钮。
        createUploadButton: function() {
            // 防止重复创建按钮。
            if (document.getElementById('siyuan-upload-btn')) return;
            
            // 查找 Miniflux 原生的按钮容器。
            const actionsList = document.querySelector('.entry-actions ul');
            if (!actionsList) { 
                // 如果没找到，可能页面还没加载完，1秒后重试。
                setTimeout(() => this.createUploadButton(), 1000); 
                return; 
            }

            // 创建按钮的 DOM 结构。
            const li = document.createElement('li'); // Miniflux 的按钮被 <li> 包裹。
            const button = document.createElement('button');
            button.id = 'siyuan-upload-btn';
            button.className = 'page-button'; // 使用 Miniflux 的按钮样式类，以保持风格一致。
            button.textContent = '上传思源';
            button.title = '上传到思源笔记';
            
            // 使用内联样式设置按钮外观，确保在任何主题下都能正常显示。
            button.style.cssText = `width: auto; height: 32px; padding: 4px 8px; display: flex; justify-content: center; align-items: center; border-radius: 8px; background-color: #007AFF; color: white; border: none; cursor: pointer; transition: background-color 150ms ease; font-size: 12px; margin: 0 2px;`;
            
            // 添加鼠标悬停效果，提升交互体验。
            button.addEventListener('mouseenter', () => { button.style.backgroundColor = '#0056CC'; });
            button.addEventListener('mouseleave', () => { button.style.backgroundColor = '#007AFF'; });
            
            // 绑定点击事件，点击时执行上传函数。
            button.addEventListener('click', () => this.uploadToSiYuan());
            
            li.appendChild(button);
            actionsList.appendChild(li); // 将按钮添加到页面中。
        }
    };

    // ===== 3. 初始化和菜单注册 =====
    // 在 Tampermonkey 的扩展菜单中注册一个命令。
    GM_registerMenuCommand('⚙️ 剪藏设置', () => { 
        Config.showSettings(); // 点击菜单项时，调用 showSettings 函数。
    });

    // 在控制台打印一条日志，方便开发者知道脚本已成功加载。
    console.log('Miniflux 文章剪藏到思源笔记脚本已加载');

    // 检查配置，如果配置不全，则自动弹出设置窗口，引导用户进行首次配置。
    if (!Config.isComplete()) {
        console.warn('检测到配置不完整，已弹出设置窗口。');
        Config.showSettings();
    }

    // 调用核心上传模块的初始化函数，启动脚本的主要逻辑。
    SiYuanUploader.init();

})(); // 结束立即执行函数。
