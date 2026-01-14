/**
 * DOM 操作工具函数
 */

// 获取元素
export function $(selector) {
    return document.querySelector(selector);
}

// 获取所有元素
export function $$(selector) {
    return document.querySelectorAll(selector);
}

// 显示元素
export function show(element) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.classList.remove('hidden');
    }
}

// 隐藏元素
export function hide(element) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.classList.add('hidden');
    }
}

// 切换元素显示状态
export function toggle(element) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.classList.toggle('hidden');
    }
}

// 添加类名
export function addClass(element, className) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.classList.add(className);
    }
}

// 移除类名
export function removeClass(element, className) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.classList.remove(className);
    }
}

// 创建元素
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    Object.keys(attributes).forEach(key => {
        if (key === 'className') {
            element.className = attributes[key];
        } else if (key === 'innerHTML') {
            element.innerHTML = attributes[key];
        } else {
            element.setAttribute(key, attributes[key]);
        }
    });

    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });

    return element;
}
