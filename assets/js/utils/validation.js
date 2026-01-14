/**
 * 表单验证工具
 */

// 验证非空
export function validateRequired(value, fieldName = '此字段') {
    if (!value || value.trim() === '') {
        return { valid: false, message: `${fieldName}不能为空` };
    }
    return { valid: true };
}

// 验证邮箱
export function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        return { valid: false, message: '邮箱格式不正确' };
    }
    return { valid: true };
}

// 验证手机号
export function validatePhone(phone) {
    const regex = /^1[3-9]\d{9}$/;
    if (!regex.test(phone)) {
        return { valid: false, message: '手机号格式不正确' };
    }
    return { valid: true };
}

// 验证数字
export function validateNumber(value, fieldName = '此字段') {
    if (isNaN(value)) {
        return { valid: false, message: `${fieldName}必须是数字` };
    }
    return { valid: true };
}

// 验证范围
export function validateRange(value, min, max, fieldName = '此字段') {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
        return { valid: false, message: `${fieldName}必须在${min}到${max}之间` };
    }
    return { valid: true };
}
