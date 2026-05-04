// ==UserScript==
// @name         知乎评论区一键复制
// @namespace    https://github.com/EverChangAn/zhihu-comment-copier
// @version      2.2.0
// @description  知乎回答页一键复制评论区：支持带序号/纯文本两种模式
// @author       EverChangAn
// @match        https://www.zhihu.com/question/*
// @match        https://www.zhihu.com/answer/*
// @grant        GM_setClipboard
// @grant        GM_notification
// @run-at       document-end
// @license      MIT
// @supportURL   https://github.com/你的用户名/zhihu-comment-copier/issues
// @downloadURL  https://github.com/你的用户名/zhihu-comment-copier/raw/main/zhihu-comment-copier.user.js
// @updateURL    https://github.com/你的用户名/zhihu-comment-copier/raw/main/zhihu-comment-copier.user.js
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        debug: false,
        notificationDuration: 2500,
    };

    // ==================== 工具 ====================
    const log = (...a) => CONFIG.debug && console.log('[知乎评论复制]', ...a);
    const clean = t => (t || '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();

    async function copyText(text) {
        if (typeof GM_setClipboard === 'function') {
            try { await GM_setClipboard(text, 'text'); return true; } catch (e) {}
        }
        try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
        try {
            const ta = Object.assign(document.createElement('textarea'), {
                style: 'position:fixed;top:-9999px', value: text
            });
            document.body.appendChild(ta);
            ta.select(); ta.setSelectionRange(0, text.length);
            document.execCommand('copy');
            document.body.removeChild(ta);
            return true;
        } catch (e) { return false; }
    }

    // ==================== 提取 ====================

    function getQuestionTitle() {
        const qt = document.querySelector('.QuestionRichText .RichText');
        if (qt) { const t = clean(qt.textContent); if (t && t.length > 3) return t; }
        const qd = document.querySelector('.QuestionHeader-detail');
        if (qd) { const t = clean(qd.textContent); if (t && t.length > 3) return t; }
        const h1 = document.querySelector('h1.QuestionHeader-title');
        if (h1) { const t = clean(h1.textContent); if (t && t.length > 3) return t; }
        const dt = document.title.replace(/\s*[-–—|]\s*知乎.*$/i, '').trim();
        return dt || null;
    }

    function getComments() {
        const divs = document.querySelectorAll('div.CommentContent');
        log(`🔍 找到 ${divs.length} 个 div.CommentContent`);

        const skipPatterns = [
            '理性发言，友善互动',
            '写下你的评论',
            '友善的评论是交流的起点',
            '评论千万条，友善第一条',
            '欢迎友善交流',
            '来说点什么吧',
            '发布',
        ];

        const out = [];
        divs.forEach((d) => {
            const t = clean(d.textContent);
            const skip = skipPatterns.some(p => t.includes(p));
            if (t && t.length > 2 && !skip) out.push(t);
        });
        return out;
    }

    // ==================== 格式化 ====================

    function formatNumbered(title, comments) {
        const parts = [];
        if (title) parts.push(`1：${title}`);
        comments.forEach((c, i) => parts.push(`${i + 2}：${c}`));
        return parts.join('\n\n');
    }

    function formatPlain(title, comments) {
        const parts = [];
        if (title) parts.push(title);
        comments.forEach(c => parts.push(c));
        return parts.join('\n\n');
    }

    // ==================== UI ====================

    let subMenuVisible = false;

    function createButton() {
        if (document.getElementById('zhihu-copy-root')) return;

        const html = `
<div id="zhihu-copy-root">
<style>
    #zhihu-copy-root {
        position: fixed; right: 20px; bottom: 130px; z-index: 99999;
        display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
    }
    .zhihu-copy-main {
        width: 50px; height: 50px; border-radius: 50%; border: none;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #fff; cursor: pointer; box-shadow: 0 4px 16px rgba(99,102,241,.45);
        display: flex; align-items: center; justify-content: center;
        transition: transform .25s, box-shadow .25s; outline: none;
        -webkit-tap-highlight-color: transparent; position: relative;
    }
    .zhihu-copy-main:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(99,102,241,.55); }
    .zhihu-copy-main:active { transform: scale(.92); }
    .zhihu-copy-main .tooltip {
        position: absolute; right: 58px; background: rgba(0,0,0,.88); color: #fff;
        padding: 6px 14px; border-radius: 6px; font-size: 13px; white-space: nowrap;
        pointer-events: none; opacity: 0; transition: opacity .2s;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .zhihu-copy-main:hover .tooltip { opacity: 1; }
    .zhihu-copy-main.ok { background: linear-gradient(135deg, #10b981, #34d399); }
    .zhihu-copy-main.fail { background: linear-gradient(135deg, #ef4444, #f87171); }

    .zhihu-copy-sub {
        height: 38px; border-radius: 19px; border: none; cursor: pointer;
        font-size: 13px; font-weight: 600; color: #fff;
        box-shadow: 0 3px 12px rgba(0,0,0,.22);
        display: flex; align-items: center; justify-content: center; gap: 6px;
        padding: 0 16px;
        transition: transform .2s, opacity .2s, box-shadow .2s;
        opacity: 0; pointer-events: none; transform: translateX(8px);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif;
    }
    .zhihu-copy-sub.show {
        opacity: 1; pointer-events: auto; transform: translateX(0);
    }
    .zhihu-copy-sub.num {
        background: linear-gradient(135deg, #6366f1, #818cf8);
    }
    .zhihu-copy-sub.plain {
        background: linear-gradient(135deg, #059669, #34d399);
    }
    .zhihu-copy-sub:hover {
        transform: scale(1.06); box-shadow: 0 5px 16px rgba(0,0,0,.3);
    }
    .zhihu-copy-sub:active {
        transform: scale(.94);
    }
</style>

<button class="zhihu-copy-main" id="zhihu-copy-main-btn" title="复制评论区">
    <span class="tooltip">📋 复制评论</span>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
</button>
<button class="zhihu-copy-sub num" id="zhihu-copy-sub-num">🔢 带序号</button>
<button class="zhihu-copy-sub plain" id="zhihu-copy-sub-plain">📝 纯文本</button>
</div>`;

        document.body.insertAdjacentHTML('beforeend', html);

        const mainBtn = document.getElementById('zhihu-copy-main-btn');
        const subNum  = document.getElementById('zhihu-copy-sub-num');
        const subPlain = document.getElementById('zhihu-copy-sub-plain');

        mainBtn.addEventListener('click', () => {
            subMenuVisible = !subMenuVisible;
            subNum.classList.toggle('show', subMenuVisible);
            subPlain.classList.toggle('show', subMenuVisible);
            mainBtn.querySelector('.tooltip').textContent = subMenuVisible ? '选择模式' : '📋 复制评论';
        });

        subNum.addEventListener('click', (e) => {
            e.stopPropagation();
            doCopy('numbered');
            hideSubMenu();
        });
        subPlain.addEventListener('click', (e) => {
            e.stopPropagation();
            doCopy('plain');
            hideSubMenu();
        });

        document.addEventListener('click', (e) => {
            if (subMenuVisible && !e.target.closest('#zhihu-copy-root')) {
                hideSubMenu();
            }
        });
    }

    function hideSubMenu() {
        subMenuVisible = false;
        const sn = document.getElementById('zhihu-copy-sub-num');
        const sp = document.getElementById('zhihu-copy-sub-plain');
        const mb = document.getElementById('zhihu-copy-main-btn');
        if (sn) sn.classList.remove('show');
        if (sp) sp.classList.remove('show');
        if (mb) mb.querySelector('.tooltip').textContent = '📋 复制评论';
    }

    async function doCopy(mode) {
        const mainBtn = document.getElementById('zhihu-copy-main-btn');
        const origHTML = mainBtn.innerHTML;

        mainBtn.innerHTML = `<span class="tooltip">收集中…</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>`;

        const title = getQuestionTitle();
        const comments = getComments();

        const text = mode === 'numbered'
            ? formatNumbered(title, comments)
            : formatPlain(title, comments);

        const commentCount = comments.length;

        if (!text || commentCount === 0) {
            mainBtn.classList.add('fail');
            mainBtn.innerHTML = `<span class="tooltip">无评论</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>`;
            if (typeof GM_notification === 'function') {
                GM_notification({ text: '未找到评论，请确保评论区已展开', title: '知乎评论复制 ❌', timeout: CONFIG.notificationDuration });
            }
        } else {
            const ok = await copyText(text);
            const totalItems = commentCount + (title ? 1 : 0);
            const label = mode === 'numbered' ? `带序号 ${totalItems} 条` : `纯文本 ${totalItems} 条`;

            if (ok) {
                mainBtn.classList.add('ok');
                mainBtn.innerHTML = `<span class="tooltip">${label} ✓</span>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>`;
                if (typeof GM_notification === 'function') {
                    GM_notification({ text: `已复制 ${label}`, title: '知乎评论复制 ✅', timeout: CONFIG.notificationDuration });
                }
            } else {
                mainBtn.classList.add('fail');
                mainBtn.innerHTML = `<span class="tooltip">失败</span>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>`;
            }
        }

        setTimeout(() => {
            mainBtn.classList.remove('ok', 'fail');
            mainBtn.innerHTML = origHTML;
            mainBtn.querySelector('.tooltip').textContent = '📋 复制评论';
        }, 2000);
    }

    // ==================== 初始化 ====================

    function isAnswerPage() {
        return /zhihu\.com\/question\/\d+\/answer\/\d+/.test(location.href);
    }

    function waitForComments(ms = 12000) {
        const start = Date.now();
        return new Promise(resolve => {
            const check = () => {
                if (document.querySelectorAll('div.CommentContent').length > 0) {
                    log(`⏱️ 评论区就绪 (${Date.now() - start}ms)`);
                    resolve(true);
                } else if (Date.now() - start > ms) {
                    resolve(false);
                } else setTimeout(check, 400);
            };
            check();
        });
    }

    async function init() {
        if (!isAnswerPage()) return;

        await waitForComments();
        createButton();

        let last = location.href;
        const onUrl = () => {
            if (location.href === last) return;
            last = location.href;
            const el = document.getElementById('zhihu-copy-root');
            if (el) el.remove();
            subMenuVisible = false;
            setTimeout(async () => { if (isAnswerPage()) { await waitForComments(); createButton(); } }, 1500);
        };
        ['pushState', 'replaceState'].forEach(m => {
            const orig = history[m];
            history[m] = function (...a) { orig.apply(this, a); onUrl(); };
        });
        window.addEventListener('popstate', onUrl);
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000))
        : setTimeout(init, 1000);
})();
