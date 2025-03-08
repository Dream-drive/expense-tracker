
// Toggle the sidebar visibility
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function showSection(sectionId) {
    // Ensure all sections remain visible
    document.querySelectorAll('.viewport').forEach(section => {
        section.style.display = 'block';
    });

    // Load charts only when Analytics page is accessed
    if (sectionId === 'analytics') {
        loadAnalytics();
    }
}


        // Helper: Get Start of Week (Sunday)
function getStartOfWeek() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    return new Date(now.setDate(now.getDate() - dayOfWeek));
}

// Helper: Get Start of Month
function getStartOfMonth() {
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}





