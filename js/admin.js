```jsx
// Wait for DOM to fully load before running script
document.addEventListener('DOMContentLoaded', function() {
    // Verify admin permissions
    checkAdminAuth();
    
    // Initialize appropriate page based on URL
    if (window.location.href.includes('dashboard.html')) {
        initializeDashboard();
    } else if (window.location.href.includes('manage-menu.html')) {
        initializeMenuManagement();
    } else if (window.location.href.includes('manage-orders.html')) {
        initializeOrderManagement();
    } else if (window.location.href.includes('manage-users.html')) {
        initializeUserManagement();
    }
});

/**
 * Verifies if current user has admin privileges
 * Redirects to login page if not authorized
 */
function checkAdminAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '../login.html';
        return;
    }
    
    // Display admin username in sidebar
    const adminNameElement = document.getElementById('admin-name');
    if (adminNameElement) {
        adminNameElement.textContent = currentUser.username;
    }
}

/**
 * Sets up dashboard page with all statistics widgets
 */
function initializeDashboard() {
    loadOrderStatistics();
    loadRevenueData();
    loadPopularItems();
    loadRecentOrders();
}

/**
 * Calculates and displays order statistics
 */
function loadOrderStatistics() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Calculate key metrics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    // Update dashboard widgets
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('pending-orders').textContent = pendingOrders;
    document.getElementById('completed-orders').textContent = completedOrders;
    document.getElementById('cancelled-orders').textContent = cancelledOrders;
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
}

/**
 * Generates revenue chart/table data
 */
function loadRevenueData() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const revenueByDate = {};
    
    // Group revenue by date
    orders.forEach(order => {
        const date = new Date(order.date).toLocaleDateString('en-US');
        revenueByDate[date] = (revenueByDate[date] || 0) + order.total;
    });
    
    // Prepare data for chart
    const chartData = Object.entries(revenueByDate)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7); // Get last 7 days only
    
    // Display data in table format
    const revenueChartElement = document.getElementById('revenue-chart');
    if (revenueChartElement) {
        let tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Revenue</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        chartData.forEach(data => {
            tableHTML += `
                <tr>
                    <td>${data.date}</td>
                    <td>$${data.revenue.toFixed(2)}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        revenueChartElement.innerHTML = tableHTML;
    }
}

/**
 * Displays top selling menu items
 */
function loadPopularItems() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const itemsSold = {};
    
    // Count items sold across all orders
    orders.forEach(order => {
        order.items.forEach(item => {
            itemsSold[item.name] = (itemsSold[item.name] || 0) + item.quantity;
        });
    });
    
    // Get top 5 items by quantity sold
    const top5Items = Object.entries(itemsSold)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    
    // Display popular items list
    const popularItemsElement = document.getElementById('popular-items');
    if (popularItemsElement && top5Items.length > 0) {
        let listHTML = '<ul class="popular-items-list">';
        
        top5Items.forEach(item => {
            listHTML += `
                <li>
                    <span class="item-name">${item.name}</span>
                    <span class="item-quantity">${item.quantity} sold</span>
                </li>
            `;
        });
        
        listHTML += '</ul>';
        popularItemsElement.innerHTML = listHTML;
    }
}

/**
 * Displays recent orders on dashboard
 */
function loadRecentOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Get 5 most recent orders
    const recentOrders = orders
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    // Populate recent orders table
    const recentOrdersTable = document.getElementById('recent-orders-table');
    if (recentOrdersTable) {
        const tableBody = recentOrdersTable.querySelector('tbody');
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            recentOrders.forEach(order => {
                const date = new Date(order.date).toLocaleDateString('en-US');
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#${order.id}</td>
                    <td>${order.customer.name}</td>
                    <td>$${order.total.toFixed(2)}</td>
                    <td><span class="status ${order.status}">${order.status}</span></td>
                    <td>${date}</td>
                    <td>
                        <button class="action-btn view-btn" data-id="${order.id}">View</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add click handlers for view buttons
            tableBody.querySelectorAll('.view-btn').forEach(button => {
                button.addEventListener('click', function() {
                    viewOrderDetails(this.getAttribute('data-id'));
                });
            });
        }
    }
}

/**
 * Sets up menu management page and item form
 */
function initializeMenuManagement() {
    loadMenuItems();
    
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm('add-item-form')) return;
            
            const formData = new FormData(this);
            
            // Create new menu item object
            const newItem = {
                id: Date.now(),
                name: formData.get('item-name'),
                category_id: parseInt(formData.get('category')),
                price: parseFloat(formData.get('price')),
                description: formData.get('description'),
                is_available: formData.get('available') === 'on'
            };
            
            // Save to localStorage
            const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
            menuItems.push(newItem);
            localStorage.setItem('menuItems', JSON.stringify(menuItems));
            
            // Refresh UI and reset form
            loadMenuItems();
            this.reset();
            alert('Menu item added successfully');
        });
    }
}

/**
 * Displays all menu items in table
 */
function loadMenuItems() {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    
    // Populate menu items table
    const menuItemsTable = document.getElementById('menu-items-table');
    if (menuItemsTable) {
        const tableBody = menuItemsTable.querySelector('tbody');
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            menuItems.forEach(item => {
                const category = categories.find(cat => cat.id === item.category_id);
                const categoryName = category ? category.name : 'Unknown';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td>${categoryName}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>${item.is_available ? 'Yes' : 'No'}</td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${item.id}">Edit</button>
                        <button class="action-btn delete-btn" data-id="${item.id}">Delete</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add click handlers for buttons
            tableBody.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', function() {
                    editMenuItem(this.getAttribute('data-id'));
                });
            });
            
            tableBody.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', function() {
                    deleteMenuItem(this.getAttribute('data-id'));
                });
            });
        }
    }
    
    // Update category dropdown in add form
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        categorySelect.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }
}

/**
 * Shows modal to edit a menu item
 * @param {string} itemId - ID of item to edit
 */
function editMenuItem(itemId) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    const item = menuItems.find(item => item.id.toString() === itemId);
    
    if (!item) return;
    
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    
    // Create edit modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Menu Item</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-item-form" class="admin-form">
                    <div class="form-group">
                        <label for="edit-item-name">Name</label>
                        <input type="text" id="edit-item-name" name="item-name" value="${item.name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-category">Category</label>
                        <select id="edit-category" name="category" required>
                            ${categories.map(category => `
                                <option value="${category.id}" ${category.id === item.category_id ? 'selected' : ''}>
                                    ${category.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-price">Price ($)</label>
                        <input type="number" id="edit-price" name="price" min="0" step="0.01" value="${item.price}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-description">Description</label>
                        <textarea id="edit-description" name="description" rows="3">${item.description || ''}</textarea>
                    </div>
                    
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" id="edit-available" name="available" ${item.is_available ? 'checked' : ''}>
                            Available
                        </label>
                    </div>
                    
                    <button type="submit" class="btn primary-btn">Save Changes</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle modal closing
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => {
        if (e.target === modal) modal.remove();
    });
    
    // Handle form submission
    document.getElementById('edit-item-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm('edit-item-form')) return;
        
        const formData = new FormData(this);
        const itemIndex = menuItems.findIndex(item => item.id.toString() === itemId);
        
        if (itemIndex !== -1) {
            // Update item data
            menuItems[itemIndex].name = formData.get('item-name');
            menuItems[itemIndex].category_id = parseInt(formData.get('category'));
            menuItems[itemIndex].price = parseFloat(formData.get('price'));
            menuItems[itemIndex].description = formData.get('description');
            menuItems[itemIndex].is_available = formData.get('available') === 'on';
            
            // Save to localStorage and update UI
            localStorage.setItem('menuItems', JSON.stringify(menuItems));
            loadMenuItems();
            
            modal.remove();
            alert('Menu item updated successfully');
        }
    });
}

/**
 * Deletes a menu item after confirmation
 * @param {string} itemId - ID of item to delete
 */
function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) {
        return;
    }
    
    // Remove item from storage
    let menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    menuItems = menuItems.filter(item => item.id.toString() !== itemId);
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    
    // Update UI
    loadMenuItems();
    alert('Menu item deleted successfully');
}

/**
 * Sets up order management page with filters
 */
function initializeOrderManagement() {
    loadOrders();
    
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            loadOrders(this.value);
        });
    }
}

/**
 * Displays orders with optional status filtering
 * @param {string} statusFilter - Filter orders by status
 */
function loadOrders(statusFilter = 'all') {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Apply status filter if specified
    if (statusFilter !== 'all') {
        orders = orders.filter(order => order.status === statusFilter);
    }
    
    // Sort by newest first
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const ordersTable = document.getElementById('orders-table');
    if (ordersTable) {
        const tableBody = ordersTable.querySelector('tbody');
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            // Show message if no orders found
            if (orders.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="empty-table">No orders found</td></tr>';
                return;
            }
            
            // Populate table with orders
            orders.forEach(order => {
                const date = new Date(order.date).toLocaleDateString('en-US');
                const time = new Date(order.date).toLocaleTimeString('en-US');
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#${order.id}</td>
                    <td>${order.customer.name}</td>
                    <td>${order.orderType}</td>
                    <td>$${order.total.toFixed(2)}</td>
                    <td><span class="status ${order.status}">${order.status}</span></td>
                    <td>${date}<br>${time}</td>
                    <td>
                        <button class="action-btn view-btn" data-id="${order.id}">View</button>
                        <button class="action-btn update-btn" data-id="${order.id}">Update</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        }
    }
}
```
