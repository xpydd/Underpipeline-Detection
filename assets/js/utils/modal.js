/**
 * 模态框管理工具
 */

// 打开模态框
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.showModal();
    }
}

// 关闭模态框
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.close();
    }
}

// 切换模态框
export function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (modal.open) {
            modal.close();
        } else {
            modal.showModal();
        }
    }
}

// 模态框点击外部关闭
export function setupModalBackdropClose(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.close();
            }
        });
    }
}
