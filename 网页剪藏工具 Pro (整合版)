// ==UserScript==
// @name         网页剪藏工具 Pro (整合版)
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  完整整合版网页剪藏工具，内置内容提取和AI标签生成，支持自定义标签、选择笔记本和现代化UI
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/@mozilla/readability@0.4.2/Readability.js
// @require      https://cdn.jsdelivr.net/npm/turndown@7.1.2/dist/turndown.js
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    // ===== 1. 配置管理模块 =====
    const Config = {
        keys: {
            siyuanApiUrl: 'web_clipper_siyuan_api_url',
            siyuanApiToken: 'web_clipper_siyuan_api_token',
            aiApiUrl: 'web_clipper_ai_api_url',
            aiApiKey: 'web_clipper_ai_api_key',
            aiModel: 'web_clipper_ai_model',
            defaultNotebookId: 'web_clipper_default_notebook_id',
            buttonPosition: 'web_clipper_button_position',
            lastSelectedNotebookId: 'web_clipper_last_notebook_id'
        },
        getAll: function() {
            return {
                siyuanApiUrl: GM_getValue(this.keys.siyuanApiUrl, ''),
                siyuanApiToken: GM_getValue(this.keys.siyuanApiToken, ''),
                aiApiUrl: GM_getValue(this.keys.aiApiUrl, ''),
                aiApiKey: GM_getValue(this.keys.aiApiKey, ''),
                aiModel: GM_getValue(this.keys.aiModel, 'glm-4-flash'),
                defaultNotebookId: GM_getValue(this.keys.defaultNotebookId, ''),
                buttonPosition: GM_getValue(this.keys.buttonPosition, { top: '100px', right: '20px' }),
                lastSelectedNotebookId: GM_getValue(this.keys.lastSelectedNotebookId, '')
            };
        },
        setAll: function(newConfig) {
            GM_setValue(this.keys.siyuanApiUrl, newConfig.siyuanApiUrl);
            GM_setValue(this.keys.siyuanApiToken, newConfig.siyuanApiToken);
            GM_setValue(this.keys.aiApiUrl, newConfig.aiApiUrl);
            GM_setValue(this.keys.aiApiKey, newConfig.aiApiKey);
            GM_setValue(this.keys.aiModel, newConfig.aiModel);
            GM_setValue(this.keys.defaultNotebookId, newConfig.defaultNotebookId);
            GM_setValue(this.keys.buttonPosition, newConfig.buttonPosition);
            if (newConfig.lastSelectedNotebookId !== undefined) {
                GM_setValue(this.keys.lastSelectedNotebookId, newConfig.lastSelectedNotebookId);
            }
        },
        isComplete: function() {
            const config = this.getAll();
            return config.siyuanApiUrl && config.siyuanApiToken && config.aiApiUrl && config.aiApiKey && config.aiModel;
        },
        showSettings: function() {
            const config = this.getAll();
            // 移除已存在的模态框
            const existingModal = document.getElementById('web-clipper-settings-modal');
            if (existingModal) {
                existingModal.remove();
            }
            // 添加样式
            GM_addStyle(`
                #web-clipper-settings-modal {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    z-index: 2147483647;
                    display: flex; justify-content: center; align-items: center;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                #web-clipper-settings-content {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    padding: 32px; border-radius: 20px;
                    width: 90%; max-width: 600px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    position: relative;
                }
                #web-clipper-settings-content h2 {
                    margin-top: 0; color: #1a1a1a; font-size: 20px;
                    display: flex; align-items: center; gap: 8px;
                }
                #web-clipper-settings-content label {
                    display: block; margin-top: 16px; margin-bottom: 6px;
                    font-weight: 500; color: #4a4a4a; font-size: 14px;
                }
                #web-clipper-settings-content input, #web-clipper-settings-content textarea {
                    width: 100%; padding: 12px; box-sizing: border-box;
                    border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 12px;
                    font-size: 14px; transition: all 0.3s;
                    background: rgba(255, 255, 255, 0.8);
                }
                #web-clipper-settings-content input:focus, #web-clipper-settings-content textarea:focus {
                    outline: none; border-color: rgba(76, 175, 80, 0.5);
                    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
                    background: rgba(255, 255, 255, 0.95);
                }
                #web-clipper-settings-buttons {
                    margin-top: 24px; text-align: right; display: flex; gap: 12px;
                    justify-content: flex-end;
                }
                #web-clipper-settings-buttons button {
                    padding: 12px 24px; border: none; border-radius: 12px;
                    cursor: pointer; font-size: 14px; font-weight: 500;
                    transition: all 0.3s; min-width: 80px;
                }
                #web-clipper-save-btn {
                    background: rgba(76, 175, 80, 0.9); color: white;
                }
                #web-clipper-save-btn:hover {
                    background: rgba(76, 175, 80, 1); transform: translateY(-1px);
                }
                #web-clipper-cancel-btn {
                    background: rgba(0, 0, 0, 0.1); color: #4a4a4a;
                }
                #web-clipper-cancel-btn:hover {
                    background: rgba(0, 0, 0, 0.15);
                }
                .config-section {
                    margin-bottom: 24px;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    padding-bottom: 20px;
                }
                .config-section:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                    padding-bottom: 0;
                }
                .section-title {
                    font-weight: 600;
                    color: #1a1a1a;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
            `);
            // 创建模态框
            const modal = document.createElement('div');
            modal.id = 'web-clipper-settings-modal';
            const content = document.createElement('div');
            content.id = 'web-clipper-settings-content';
            // 创建标题
            const title = document.createElement('h2');
            title.textContent = '⚙️ 剪藏工具配置';
            content.appendChild(title);

            // 思源笔记配置部分
            const siyuanSection = document.createElement('div');
            siyuanSection.className = 'config-section';
            
            const siyuanTitle = document.createElement('div');
            siyuanTitle.className = 'section-title';
            siyuanTitle.textContent = '📚 思源笔记配置';
            siyuanSection.appendChild(siyuanTitle);

            // 思源 API 地址
            const siyuanApiUrlLabel = document.createElement('label');
            siyuanApiUrlLabel.textContent = '思源笔记 API 地址';
            siyuanApiUrlLabel.setAttribute('for', 'siyuanApiUrl');
            siyuanSection.appendChild(siyuanApiUrlLabel);
            
            const siyuanApiUrlInput = document.createElement('input');
            siyuanApiUrlInput.type = 'url';
            siyuanApiUrlInput.id = 'siyuanApiUrl';
            siyuanApiUrlInput.placeholder = 'http://localhost:6806';
            siyuanApiUrlInput.value = config.siyuanApiUrl;
            siyuanSection.appendChild(siyuanApiUrlInput);

            // 思源 API Token
            const siyuanApiTokenLabel = document.createElement('label');
            siyuanApiTokenLabel.textContent = '思源笔记 API Token';
            siyuanApiTokenLabel.setAttribute('for', 'siyuanApiToken');
            siyuanSection.appendChild(siyuanApiTokenLabel);
            
            const siyuanApiTokenInput = document.createElement('input');
            siyuanApiTokenInput.type = 'password';
            siyuanApiTokenInput.id = 'siyuanApiToken';
            siyuanApiTokenInput.placeholder = '请输入API Token';
            siyuanApiTokenInput.value = config.siyuanApiToken;
            siyuanSection.appendChild(siyuanApiTokenInput);

            // 默认笔记本ID
            const defaultNotebookIdLabel = document.createElement('label');
            defaultNotebookIdLabel.textContent = '默认笔记本ID (可选，可在剪藏时选择)';
            defaultNotebookIdLabel.setAttribute('for', 'defaultNotebookId');
            siyuanSection.appendChild(defaultNotebookIdLabel);
            
            const defaultNotebookIdInput = document.createElement('input');
            defaultNotebookIdInput.type = 'text';
            defaultNotebookIdInput.id = 'defaultNotebookId';
            defaultNotebookIdInput.placeholder = '请输入笔记本ID';
            defaultNotebookIdInput.value = config.defaultNotebookId;
            siyuanSection.appendChild(defaultNotebookIdInput);

            content.appendChild(siyuanSection);

            // AI 配置部分
            const aiSection = document.createElement('div');
            aiSection.className = 'config-section';
            
            const aiTitle = document.createElement('div');
            aiTitle.className = 'section-title';
            aiTitle.textContent = '🤖 AI 配置';
            aiSection.appendChild(aiTitle);

            // AI API 地址
            const aiApiUrlLabel = document.createElement('label');
            aiApiUrlLabel.textContent = 'AI API 地址';
            aiApiUrlLabel.setAttribute('for', 'aiApiUrl');
            aiSection.appendChild(aiApiUrlLabel);
            
            const aiApiUrlInput = document.createElement('input');
            aiApiUrlInput.type = 'url';
            aiApiUrlInput.id = 'aiApiUrl';
            aiApiUrlInput.placeholder = 'https://api.openai.com/v1/chat/completions';
            aiApiUrlInput.value = config.aiApiUrl;
            aiSection.appendChild(aiApiUrlInput);

            // AI API Key
            const aiApiKeyLabel = document.createElement('label');
            aiApiKeyLabel.textContent = 'AI API Key';
            aiApiKeyLabel.setAttribute('for', 'aiApiKey');
            aiSection.appendChild(aiApiKeyLabel);
            
            const aiApiKeyInput = document.createElement('input');
            aiApiKeyInput.type = 'password';
            aiApiKeyInput.id = 'aiApiKey';
            aiApiKeyInput.placeholder = '请输入API Key';
            aiApiKeyInput.value = config.aiApiKey;
            aiSection.appendChild(aiApiKeyInput);

            // AI 模型
            const aiModelLabel = document.createElement('label');
            aiModelLabel.textContent = 'AI 模型';
            aiModelLabel.setAttribute('for', 'aiModel');
            aiSection.appendChild(aiModelLabel);
            
            const aiModelInput = document.createElement('input');
            aiModelInput.type = 'text';
            aiModelInput.id = 'aiModel';
            aiModelInput.placeholder = 'glm-4-flash';
            aiModelInput.value = config.aiModel;
            aiSection.appendChild(aiModelInput);

            content.appendChild(aiSection);

            // 创建按钮
            const buttons = document.createElement('div');
            buttons.id = 'web-clipper-settings-buttons';
            const cancelButton = document.createElement('button');
            cancelButton.id = 'web-clipper-cancel-btn';
            cancelButton.textContent = '取消';
            cancelButton.addEventListener('click', () => {
                modal.remove();
            });
            buttons.appendChild(cancelButton);
            const saveButton = document.createElement('button');
            saveButton.id = 'web-clipper-save-btn';
            saveButton.textContent = '保存';
            saveButton.addEventListener('click', () => {
                const newConfig = {
                    siyuanApiUrl: siyuanApiUrlInput.value.trim(),
                    siyuanApiToken: siyuanApiTokenInput.value.trim(),
                    aiApiUrl: aiApiUrlInput.value.trim(),
                    aiApiKey: aiApiKeyInput.value.trim(),
                    aiModel: aiModelInput.value.trim(),
                    defaultNotebookId: defaultNotebookIdInput.value.trim(),
                    buttonPosition: config.buttonPosition,
                    lastSelectedNotebookId: config.lastSelectedNotebookId
                };
                this.setAll(newConfig);
                modal.remove();
                Toast.show('配置已保存！', 'success');
                setTimeout(() => {
                    if (!this.isComplete()) {
                        this.showSettings();
                    }
                }, 1000);
            });
            buttons.appendChild(saveButton);
            content.appendChild(buttons);
            modal.appendChild(content);
            // 添加到body
            document.body.appendChild(modal);
            // 绑定背景点击事件
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
    };

    // ===== 2. Toast 通知系统 =====
    const Toast = {
        show: function(message, type = 'info', duration = 3000) {
            // 添加样式
            if (!document.querySelector('#toast-styles')) {
                GM_addStyle(`
                    .toast {
                        position: fixed; top: 20px; right: 20px; z-index: 2147483647;
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                        border-radius: 12px; padding: 16px 20px;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2); display: flex;
                        align-items: center; gap: 12px; min-width: 250px;
                        animation: slideInRight 0.3s ease; max-width: 90vw;
                    }
                    .toast-success { border-left: 4px solid rgba(76, 175, 80, 0.8); }
                    .toast-error { border-left: 4px solid rgba(244, 67, 54, 0.8); }
                    .toast-info { border-left: 4px solid rgba(33, 150, 243, 0.8); }
                    .toast-icon { font-size: 20px; }
                    .toast-message { flex: 1; font-size: 14px; color: #1a1a1a; }
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `);
            }
            // 创建toast元素
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            // 创建图标
            const icon = document.createElement('div');
            icon.className = 'toast-icon';
            icon.textContent = this.getIcon(type);
            // 创建消息
            const messageEl = document.createElement('div');
            messageEl.className = 'toast-message';
            messageEl.textContent = message;
            // 组装
            toast.appendChild(icon);
            toast.appendChild(messageEl);
            // 添加到body
            document.body.appendChild(toast);
            // 自动移除
            setTimeout(() => {
                toast.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },
        getIcon: function(type) {
            const icons = {
                success: '✅',
                error: '❌',
                info: 'ℹ️'
            };
            return icons[type] || icons.info;
        }
    };

    // ===== 3. 剪藏面板模块 =====
    const ClipperPanel = {
        isVisible: false,
        panel: null,
        show: function() {
            if (this.isVisible) return;
            this.isVisible = true;
            // 移除已存在的面板
            const existingPanel = document.getElementById('clipper-panel');
            if (existingPanel) {
                existingPanel.remove();
            }
            // 添加样式
            if (!document.querySelector('#clipper-styles')) {
                GM_addStyle(`
                    #clipper-panel {
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(0, 0, 0, 0.3);
                        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                        z-index: 2147483647;
                        display: flex; justify-content: center; align-items: center;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    }
                    .clipper-content {
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                        border-radius: 20px; width: 90%; max-width: 500px;
                        max-height: 80vh; overflow-y: auto;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                        position: relative;
                    }
                    .clipper-header {
                        padding: 24px; border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                        display: flex; justify-content: space-between; align-items: center;
                    }
                    .clipper-title { font-size: 18px; font-weight: 600; color: #1a1a1a; }
                    .clipper-close {
                        width: 32px; height: 32px; border-radius: 50%;
                        border: none; background: rgba(0, 0, 0, 0.1); cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        transition: all 0.3s; font-size: 18px; color: #4a4a4a;
                    }
                    .clipper-close:hover {
                        background: rgba(0, 0, 0, 0.15);
                        transform: rotate(90deg);
                    }
                    .clipper-body { padding: 24px; }
                    .info-item {
                        margin-bottom: 20px;
                    }
                    .info-label {
                        font-size: 12px; color: #6a6a6a; margin-bottom: 8px;
                        font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;
                    }
                    .info-input, .info-select {
                        width: 100%; padding: 12px;
                        border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 12px;
                        font-size: 14px; transition: all 0.3s;
                        background: rgba(255, 255, 255, 0.8);
                        box-sizing: border-box;
                    }
                    .info-select {
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        appearance: none;
                        background-image: url("image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
                        background-repeat: no-repeat;
                        background-position: right 12px center;
                        background-size: 1em;
                        padding-right: 36px;
                    }
                    .info-input:focus, .info-select:focus {
                        outline: none; border-color: rgba(76, 175, 80, 0.5);
                        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
                        background: rgba(255, 255, 255, 0.95);
                    }
                    .info-input:hover, .info-select:hover {
                        border-color: rgba(0, 0, 0, 0.2);
                    }
                    .tags-hint {
                        font-size: 12px; color: #6a6a6a; margin-top: 8px;
                        display: flex; align-items: center; gap: 4px;
                    }
                    .clipper-footer {
                        padding: 24px; border-top: 1px solid rgba(0, 0, 0, 0.1);
                        display: flex; gap: 12px; justify-content: flex-end;
                    }
                    .clipper-btn {
                        padding: 12px 24px; border: none; border-radius: 12px;
                        cursor: pointer; font-size: 14px; font-weight: 500;
                        transition: all 0.3s; min-width: 100px;
                    }
                    .btn-clip {
                        background: rgba(76, 175, 80, 0.9); color: white;
                    }
                    .btn-clip:hover:not(:disabled) {
                        background: rgba(76, 175, 80, 1); transform: translateY(-1px);
                    }
                    .btn-clip:disabled {
                        background: rgba(0, 0, 0, 0.2); cursor: not-allowed;
                    }
                    .btn-cancel {
                        background: rgba(0, 0, 0, 0.1); color: #4a4a4a;
                    }
                    .btn-cancel:hover { background: rgba(0, 0, 0, 0.15); }
                    .loading-spinner {
                        display: inline-block; width: 16px; height: 16px;
                        border: 2px solid #ffffff; border-radius: 50%;
                        border-top-color: transparent; animation: spin 0.8s linear infinite;
                    }
                    @keyframes spin { to { transform: rotate(360deg); } }
                    .notebook-container {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .notebook-select {
                        flex: 1;
                    }
                    .notebook-refresh {
                        width: 32px;
                        height: 32px;
                        border-radius: 8px;
                        border: 1px solid rgba(0,0,0,0.1);
                        background: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .notebook-refresh:hover {
                        background: rgba(0,0,0,0.05);
                    }
                `);
            }
            // 创建面板
            const panel = document.createElement('div');
            panel.id = 'clipper-panel';
            const content = document.createElement('div');
            content.className = 'clipper-content';
            // 创建头部
            const header = document.createElement('div');
            header.className = 'clipper-header';
            const title = document.createElement('div');
            title.className = 'clipper-title';
            title.textContent = '⚡️ 网页剪藏';
            const closeButton = document.createElement('button');
            closeButton.className = 'clipper-close';
            closeButton.textContent = '×';
            closeButton.addEventListener('click', () => {
                this.hide();
            });
            header.appendChild(title);
            header.appendChild(closeButton);
            // 创建主体
            const body = document.createElement('div');
            body.className = 'clipper-body';
            // 笔记本选择
            const notebookContainer = document.createElement('div');
            notebookContainer.className = 'info-item';
            const notebookLabel = document.createElement('div');
            notebookLabel.className = 'info-label';
            notebookLabel.textContent = '笔记本';
            const notebookSelectWrapper = document.createElement('div');
            notebookSelectWrapper.className = 'notebook-container';
            const notebookSelect = document.createElement('select');
            notebookSelect.className = 'info-select notebook-select';
            notebookSelect.id = 'notebook-select';
            notebookSelect.innerHTML = '<option value="">选择笔记本</option>';
            notebookSelect.disabled = true;
            const refreshButton = document.createElement('button');
            refreshButton.className = 'notebook-refresh';
            refreshButton.innerHTML = '🔄';
            refreshButton.title = '刷新笔记本列表';
            refreshButton.addEventListener('click', () => {
                WebClipper.fetchNotebooks();
            });
            notebookSelectWrapper.appendChild(notebookSelect);
            notebookSelectWrapper.appendChild(refreshButton);
            notebookContainer.appendChild(notebookLabel);
            notebookContainer.appendChild(notebookSelectWrapper);
            // 标题输入
            const titleContainer = document.createElement('div');
            titleContainer.className = 'info-item';
            const titleLabel = document.createElement('div');
            titleLabel.className = 'info-label';
            titleLabel.textContent = '标题';
            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.className = 'info-input';
            titleInput.id = 'clip-title-input';
            titleInput.value = document.title;
            titleInput.placeholder = '输入文章标题';
            titleContainer.appendChild(titleLabel);
            titleContainer.appendChild(titleInput);
            // URL输入
            const urlContainer = document.createElement('div');
            urlContainer.className = 'info-item';
            const urlLabel = document.createElement('div');
            urlLabel.className = 'info-label';
            urlLabel.textContent = '链接';
            const urlInput = document.createElement('input');
            urlInput.type = 'url';
            urlInput.className = 'info-input';
            urlInput.id = 'clip-url-input';
            urlInput.value = window.location.href;
            urlInput.placeholder = '输入文章链接';
            urlContainer.appendChild(urlLabel);
            urlContainer.appendChild(urlInput);
            // 标签输入
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'info-item';
            const tagsLabel = document.createElement('div');
            tagsLabel.className = 'info-label';
            tagsLabel.textContent = '自定义标签（可选）';
            const tagsInput = document.createElement('input');
            tagsInput.type = 'text';
            tagsInput.className = 'info-input';
            tagsInput.id = 'custom-tags-input';
            tagsInput.placeholder = '输入标签，用逗号或空格分隔';
            const tagsHint = document.createElement('div');
            tagsHint.className = 'tags-hint';
            tagsHint.textContent = '💡 AI将根据您的标签生成补充标签，避免重复';
            tagsContainer.appendChild(tagsLabel);
            tagsContainer.appendChild(tagsInput);
            tagsContainer.appendChild(tagsHint);
            // 添加所有组件到body
            body.appendChild(notebookContainer);
            body.appendChild(titleContainer);
            body.appendChild(urlContainer);
            body.appendChild(tagsContainer);
            // 创建底部
            const footer = document.createElement('div');
            footer.className = 'clipper-footer';
            const cancelButton = document.createElement('button');
            cancelButton.className = 'clipper-btn btn-cancel';
            cancelButton.textContent = '取消';
            cancelButton.addEventListener('click', () => {
                this.hide();
            });
            const clipButton = document.createElement('button');
            clipButton.className = 'clipper-btn btn-clip';
            const buttonText = document.createElement('span');
            buttonText.id = 'clip-button-text';
            buttonText.textContent = '开始剪藏';
            clipButton.appendChild(buttonText);
            clipButton.addEventListener('click', () => {
                WebClipper.doClip();
            });
            footer.appendChild(cancelButton);
            footer.appendChild(clipButton);
            // 组装面板
            content.appendChild(header);
            content.appendChild(body);
            content.appendChild(footer);
            panel.appendChild(content);
            // 添加到body
            document.body.appendChild(panel);
            this.panel = panel;
            // 绑定背景点击事件
            panel.addEventListener('click', (e) => {
                if (e.target === panel) {
                    this.hide();
                }
            });
            // 自动聚焦标题输入框
            setTimeout(() => {
                titleInput.focus();
                titleInput.select();
            }, 300);
            // 显示后加载笔记本列表
            setTimeout(() => {
                WebClipper.fetchNotebooks();
            }, 300);
        },
        hide: function() {
            if (this.panel) {
                this.panel.remove();
                this.panel = null;
            }
            this.isVisible = false;
        },
        setLoading: function(loading) {
            const button = document.querySelector('.btn-clip');
            const buttonText = document.getElementById('clip-button-text');
            if (button && buttonText) {
                if (loading) {
                    button.disabled = true;
                    buttonText.textContent = '';
                    const spinner = document.createElement('span');
                    spinner.className = 'loading-spinner';
                    buttonText.parentNode.insertBefore(spinner, buttonText);
                    buttonText.textContent = ' 剪藏中...';
                } else {
                    button.disabled = false;
                    const spinner = button.querySelector('.loading-spinner');
                    if (spinner) spinner.remove();
                    buttonText.textContent = '开始剪藏';
                }
            }
        }
    };

    // ===== 4. 核心剪藏模块 =====
    const WebClipper = {
        config: {},
        button: null,
        dragThrottle: null,
        notebooks: [],
        init: function() {
            this.config = Config.getAll();
            if (!Config.isComplete()) {
                console.warn('脚本配置不完整，请在菜单中打开设置进行配置。');
                // 自动打开设置
                setTimeout(() => Config.showSettings(), 1000);
                return;
            }
            console.log(`Web Clipper: 启动`);
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.createFloatingButton());
            } else {
                setTimeout(() => this.createFloatingButton(), 500);
            }
        },
        fetchWithGM: function(details) {
            return new Promise((resolve, reject) => {
                details.onload = (res) => {
                    try {
                        const response = {
                            status: res.status,
                            statusText: res.statusText,
                            responseText: res.responseText
                        };
                        const contentType = res.responseHeaders.match(/content-type:\s*([^;]+)/i);
                        if (contentType && contentType[1].includes('application/json')) {
                            response.data = JSON.parse(res.responseText);
                        }
                        if (res.status >= 200 && res.status < 300) {
                            resolve(response);
                        } else {
                            reject(new Error(`请求失败: ${res.status} ${res.statusText}`));
                        }
                    } catch (error) {
                        reject(error);
                    }
                };
                details.onerror = (err) => reject(err);
                GM_xmlhttpRequest(details);
            });
        },
        fetchNotebooks: async function() {
            const selectElement = document.getElementById('notebook-select');
            if (!selectElement) return;
            selectElement.disabled = true;
            selectElement.innerHTML = '<option value="">正在加载笔记本列表...</option>';
            try {
                const response = await this.fetchWithGM({
                    method: 'POST',
                    url: `${this.config.siyuanApiUrl}/api/notebook/lsNotebooks`,
                    headers: {
                        'Authorization': `Token ${this.config.siyuanApiToken}`,
                        'Content-Type': 'application/json'
                    },
                     JSON.stringify({})
                });
                if (response.data.code === 0) {
                    this.notebooks = response.data.data.notebooks;
                    selectElement.innerHTML = '';
                    this.notebooks.forEach(nb => {
                        const option = document.createElement('option');
                        option.value = nb.id;
                        option.textContent = nb.name;
                        selectElement.appendChild(option);
                    });
                    // 设置上次选择的笔记本
                    if (this.config.lastSelectedNotebookId) {
                        selectElement.value = this.config.lastSelectedNotebookId;
                    } else if (this.config.defaultNotebookId) {
                        selectElement.value = this.config.defaultNotebookId;
                    }
                } else {
                    throw new Error(response.data.msg || '获取笔记本列表失败');
                }
            } catch (error) {
                console.error('加载笔记本列表失败:', error);
                selectElement.innerHTML = '<option value="">加载失败：' + (error.message || '未知错误') + '</option>';
                Toast.show('加载笔记本列表失败', 'error');
            } finally {
                selectElement.disabled = false;
            }
        },
        // AI生成标签的函数（支持自定义标签参考）
        generateTagsWithLLM: async function(title, content, customTags = []) {
            const customTagsText = customTags.length > 0 ? 
                `用户已提供的标签（请避免生成相似或重复的标签）：${customTags.join('、')}` : '';
            const prompt = `请根据以下文章标题和内容，生成3到5个最能概括文章核心主题的标签。${customTagsText}
要求：
1. 标签需要简洁、精准，使用中文，并且是两字名词
2. 如果用户已提供标签，请生成补充性的标签，避免重复
3. 请直接返回标签，用逗号分隔，不要有任何其他解释或格式
标题：
 ${title}
内容：
 ${content.substring(0, 2000)}...`;
            try {
                const response = await this.fetchWithGM({
                    method: 'POST',
                    url: this.config.aiApiUrl,
                    headers: {
                        'Authorization': `Bearer ${this.config.aiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        model: this.config.aiModel,
                        messages: [
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        temperature: 0.5,
                        max_tokens: 100,
                        stream: false,
                        thinking: {
                            type: "disabled"
                        }
                    })
                });
                if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
                    const tags = response.data.choices[0].message.content.trim();
                    console.log(`AI生成的标签: ${tags}`);
                    return tags;
                } else {
                    console.error('AI响应格式不正确:', response.data);
                    return '';
                }
            } catch (error) {
                console.error('调用AI API失败:', error);
                return '';
            }
        },
        // 合并并去重标签
        mergeTags: function(customTags, aiTagsString) {
            const aiTags = aiTagsString ? aiTagsString.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag) : [];
            const allTags = [...new Set([...customTags, ...aiTags])];
            return allTags.join('，');
        },
        // 保存到思源笔记的函数 (支持按月分类和指定笔记本)
        saveToSiyuan: async function(title, markdown, tags, url, notebookId) {
            // 按月创建文件夹
            const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
            const sanitizedTitle = title.replace(/[\/\\:*?"<>|]/g, '_');
            const docPath = `/web-clips/${currentMonth}/${sanitizedTitle}`;
            const payload = {
                notebook: notebookId,
                path: docPath,
                markdown: markdown,
                tags: tags
            };
            try {
                const response = await this.fetchWithGM({
                    method: 'POST',
                    url: `${this.config.siyuanApiUrl}/api/filetree/createDocWithMd`,
                    headers: {
                        'Authorization': `Token ${this.config.siyuanApiToken}`,
                        'Content-Type': 'application/json'
                    },
                     JSON.stringify(payload)
                });
                console.log('成功保存到思源笔记:', response.data);
                return response.data;
            } catch (error) {
                console.error('保存到思源笔记失败:', error);
                throw error;
            }
        },
        doClip: async function() {
            const titleInput = document.getElementById('clip-title-input');
            const urlInput = document.getElementById('clip-url-input');
            const tagsInput = document.getElementById('custom-tags-input');
            const notebookSelect = document.getElementById('notebook-select');
            const title = titleInput ? titleInput.value.trim() : document.title;
            const url = urlInput ? urlInput.value.trim() : window.location.href;
            const customTags = tagsInput ?
                tagsInput.value.split(/[,，\s]+/).map(tag => tag.trim()).filter(tag => tag) : [];
            const notebookId = notebookSelect ? notebookSelect.value : null;
            // 验证必填字段
            if (!title) {
                Toast.show('请输入标题', 'error');
                return;
            }
            if (!url) {
                Toast.show('请输入链接', 'error');
                return;
            }
            if (!notebookId) {
                Toast.show('请选择一个笔记本', 'error');
                return;
            }
            ClipperPanel.setLoading(true);
            try {
                // 使用Readability提取主要内容
                const articleContent = document.documentElement.innerHTML;
                const doc = document.implementation.createHTMLDocument('temp');
                doc.documentElement.innerHTML = articleContent;
                const reader = new Readability(doc);
                const article = reader.parse();
                if (!article || !article.content) {
                    throw new Error('无法提取文章内容');
                }
                // 使用Turndown将HTML转换为Markdown
                const turndownService = new TurndownService({
                    headingStyle: 'atx',
                    bulletListMarker: '-',
                    codeBlockStyle: 'fenced'
                });
                const markdown = turndownService.turndown(article.content);
                const markdownWithHeader = `# ${article.title}
> [原文链接](${url})
---
${markdown}`;
                // 调用AI生成标签（参考自定义标签）
                const aiTags = await this.generateTagsWithLLM(article.title, article.textContent, customTags);
                // 合并并去重标签
                const allTags = this.mergeTags(customTags, aiTags);
                // 保存到思源笔记
                await this.saveToSiyuan(article.title, markdownWithHeader, allTags, url, notebookId);
                // 保存用户选择的笔记本ID
                const currentConfig = Config.getAll();
                currentConfig.lastSelectedNotebookId = notebookId;
                Config.setAll(currentConfig);
                ClipperPanel.hide();
                Toast.show(`剪藏成功！生成标签：${allTags}`, 'success');
                if (this.button) {
                    const originalText = this.button.textContent;
                    this.button.textContent = '✅';
                    setTimeout(() => { 
                        this.button.textContent = originalText; 
                    }, 2000);
                }
            } catch (error) {
                console.error('剪藏失败:', error);
                Toast.show(`剪藏失败: ${error.message}`, 'error');
            } finally {
                ClipperPanel.setLoading(false);
            }
        },
        makeDraggable: function(element) {
            let isDragging = false;
            let startX, startY, initialTop, initialRight;
            function handleStart(e) {
                isDragging = true;
                startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
                startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
                const rect = element.getBoundingClientRect();
                initialTop = rect.top;
                initialRight = window.innerWidth - rect.right;
                element.style.cursor = 'grabbing';
                element.style.transition = 'none';
            }
            function handleMove(e) {
                if (!isDragging) return;
                // 使用节流优化性能
                if (WebClipper.dragThrottle) return;
                WebClipper.dragThrottle = requestAnimationFrame(() => {
                    WebClipper.dragThrottle = null;
                    e.preventDefault();
                    const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
                    const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
                    const deltaY = currentY - startY;
                    const deltaX = currentX - startX;
                    const newTop = initialTop + deltaY;
                    const newRight = initialRight - deltaX;
                    element.style.top = `${newTop}px`;
                    element.style.right = `${newRight}px`;
                    element.style.left = 'auto';
                    element.style.bottom = 'auto';
                });
            }
            function handleEnd() {
                if (!isDragging) return;
                isDragging = false;
                element.style.cursor = 'move';
                element.style.transition = '';
                if (WebClipper.dragThrottle) {
                    cancelAnimationFrame(WebClipper.dragThrottle);
                    WebClipper.dragThrottle = null;
                }
                const style = window.getComputedStyle(element);
                const newPosition = { top: style.top, right: style.right };
                WebClipper.config.buttonPosition = newPosition;
                Config.setAll(WebClipper.config);
            }
            element.addEventListener('mousedown', handleStart);
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleEnd);
            element.addEventListener('touchstart', handleStart, { passive: false });
            document.addEventListener('touchmove', handleMove, { passive: false });
            element.addEventListener('touchend', handleEnd);
        },
        createFloatingButton: function() {
            if (document.getElementById('web-clipper-btn')) return;
            // 添加样式
            GM_addStyle(`
                #web-clipper-btn {
                    position: fixed; z-index: 2147483646; cursor: move; user-select: none;
                    font-size: 24px; top: ${this.config.buttonPosition.top}; right: ${this.config.buttonPosition.right};
                    width: 48px; height: 48px; border-radius: 50%;
                    background: linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(69, 160, 73, 0.9));
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    color: white; display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 8px 32px -8px rgba(76, 175, 80, 0.4);
                    transition: all 0.2s ease;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                #web-clipper-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 12px 40px -8px rgba(76, 175, 80, 0.5);
                    background: linear-gradient(135deg, rgba(76, 175, 80, 1), rgba(69, 160, 73, 1));
                }
                #web-clipper-btn:active {
                    transform: scale(0.95);
                }
                @media (max-width: 768px) {
                    #web-clipper-btn {
                        width: 44px; height: 44px; font-size: 20px;
                    }
                }
            `);
            this.button = document.createElement('div');
            this.button.id = 'web-clipper-btn';
            this.button.title = '点击剪藏，双击打开设置';
            this.button.textContent = '⚡️';
            document.body.appendChild(this.button);
            this.makeDraggable(this.button);
            this.button.addEventListener('click', (e) => {
                if (e.detail === 1) {
                    setTimeout(() => ClipperPanel.show(), 200);
                }
            });
            this.button.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                Config.showSettings();
            });
            console.log('剪藏按钮已创建');
        }
    };

    // ===== 5. 初始化和菜单注册 =====
    GM_registerMenuCommand('⚙️ 剪藏工具设置', () => { 
        Config.showSettings(); 
    });
    console.log('Web Clipper Pro (整合版) 脚本已加载');
    WebClipper.init();
})();
