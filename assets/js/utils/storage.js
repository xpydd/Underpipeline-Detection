/**
 * 本地存储工具
 */

// 保存数据到 localStorage
export function saveToLocal(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('保存数据失败:', e);
        return false;
    }
}

// 从 localStorage 读取数据
export function getFromLocal(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
        console.error('读取数据失败:', e);
        return defaultValue;
    }
}

// 从 localStorage 删除数据
export function removeFromLocal(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.error('删除数据失败:', e);
        return false;
    }
}

// 清空 localStorage
export function clearLocal() {
    try {
        localStorage.clear();
        return true;
    } catch (e) {
        console.error('清空数据失败:', e);
        return false;
    }
}
