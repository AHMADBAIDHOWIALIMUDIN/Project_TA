// Sidebar Toggle Functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}

function toggleSidebarCollapse() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    const icon = document.querySelector('.sidebar-toggle i');
    if (sidebar.classList.contains('collapsed')) {
        icon.classList.remove('fa-chevron-left');
        icon.classList.add('fa-chevron-right');
    } else {
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-left');
    }
}

// Update current time
function updateTime() {
    const timeElement = document.getElementById('currentTime');
    if (!timeElement) return;
    
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    timeElement.textContent = now.toLocaleDateString('id-ID', options);
}

// Show mobile menu button on small screens
function handleResize() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    if (!mobileBtn) return;
    
    if (window.innerWidth <= 768) {
        mobileBtn.style.display = 'flex';
    } else {
        mobileBtn.style.display = 'none';
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
    }
}

// Initialize sidebar functionality
function initializeSidebar() {
    updateTime();
    setInterval(updateTime, 60000);
    handleResize();
    window.addEventListener('resize', handleResize);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSidebar);
} else {
    initializeSidebar();
}
