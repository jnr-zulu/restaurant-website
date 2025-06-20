document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    checkAdminAuth();
    
    // Initialize admin dashboard
    if (window.location.href.includes('dashboard.html')) {
        initializeDashboard();
    }
    
    // Initialize menu management
    if (window.location.href.includes('manage-menu.html')) {
        initializeMenuManagement();
    }
    
    // Initialize order management
    if (window.location.href.includes('manage-orders.html')) {
        initializeOrderManagement();
    }
    
    // Initialize user management
    if (window.location.href.includes('manage-users.html')) {
        initializeUserManagement();
    }
});

function checkAdminAuth() {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '../login.html';
        return;
    }
    
    // Update admin name in sidebar
    const adminNameElement = document.getElementById('admin-name');
    if (adminNameElement) {
        adminNameElement.textContent = currentUser.username;
    }
}

function initializeDashboard() {
    // Load data for dashboard widgets
    loadOrderStatistics();
    loadRevenueData();
    loadPopularItems();
    loadRecentOrders();
}

function loadOrderStatistics() {
    // Get all orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Calculate statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    
    // Get revenue
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    // Update statistics widgets
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('pending-orders').textContent = pendingOrders;
    document.getElementById('completed-orders').textContent = completedOrders;
    document.getElementById('cancelled-orders').textContent = cancelledOrders;
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
}

function loadRevenueData() {
    // Get all orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Group orders by date
    const revenueByDate = {};
    
    orders.forEach(order => {
        const date = new Date(order.date).toLocaleDateString('en-US');
        
        if (!revenueByDate[date]) {
            revenueByDate[date] = 0;
        }
        
        revenueByDate[date] += order.total;
    });
    
    // Convert to array for chart
    const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({
        date,
        revenue
    }));
    
    // Sort by date
    chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get last 7 days of data
    const last7DaysData = chartData.slice(-7);
    
    // Create chart (using chartjs or other library)
    // This is a placeholder - in a real app, you'd implement actual chart rendering
    console.log('Revenue Chart Data:', last7DaysData);
    
    // For demo purposes, display data in a table
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
        
        last7DaysData.forEach(data => {
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

function loadPopularItems() {
    // Get all orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Count items sold
    const itemsSold = {};
    
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!itemsSold[item.name]) {
                itemsSold[item.name] = 0;
            }
            
            itemsSold[item.name] += item.quantity;
        });
    });
    
    // Convert to array for sorting
    const popularItems = Object.entries(itemsSold).map(([name, quantity]) => ({
        name,
        quantity
    }));
    
    // Sort by quantity (descending)
    popularItems.sort((a, b) => b.quantity - a.quantity);
    
    // Get top 5 items
    const top5Items = popularItems.slice(0, 5);
    
    // Update popular items list
    const popularItemsElement = document.getElementById('popular-items');
    
    if (popularItemsElement) {
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

function loadRecentOrders() {
    // Get all orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Sort by date (newest first)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Get latest 5 orders
    const recentOrders = orders.slice(0, 5);
    
    // Update recent orders table
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
            
            // Add event listeners to view buttons
            const viewButtons = tableBody.querySelectorAll('.view-btn');
            viewButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-id');
                    viewOrderDetails(orderId);
                });
            });
        }
    }
}

function initializeMenuManagement() {
    // Load menu items
    loadMenuItems();
    
    // Initialize add menu item form
    const addItemForm = document.getElementById('add-item-form');
    
    if (addItemForm) {
        addItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm('add-item-form')) {
                return;
            }
            
            // Get form data
            const formData = new FormData(this);
            
            // Create new menu item
            const newItem = {
                id: Date.now(),
                name: formData.get('item-name'),
                category_id: parseInt(formData.get('category')),
                price: parseFloat(formData.get('price')),
                description: formData.get('description'),
                is_available: formData.get('available') === 'on'
            };
            
            // Get existing menu items
            let menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
            
            // Add new item
            menuItems.push(newItem);
            
            // Save to localStorage
            localStorage.setItem('menuItems', JSON.stringify(menuItems));
            
            // Reload menu items
            loadMenuItems();
            
            // Reset form
            this.reset();
            
            // Show success message
            alert('Menu item added successfully');
        });
    }
}

function loadMenuItems() {
    // Get menu items
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    
    // Get categories
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    
    // Update menu items table
    const menuItemsTable = document.getElementById('menu-items-table');
    
    if (menuItemsTable) {
        const tableBody = menuItemsTable.querySelector('tbody');
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            menuItems.forEach(item => {
                // Find category name
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
            
            // Add event listeners to action buttons
            const editButtons = tableBody.querySelectorAll('.edit-btn');
            const deleteButtons = tableBody.querySelectorAll('.delete-btn');
            
            editButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const itemId = this.getAttribute('data-id');
                    editMenuItem(itemId);
                });
            });
            
            deleteButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const itemId = this.getAttribute('data-id');
                    deleteMenuItem(itemId);
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

function editMenuItem(itemId) {
    // Get menu items
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    
    // Find item
    const item = menuItems.find(item => item.id.toString() === itemId);
    
    if (!item) return;
    
    // Get categories
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    
    // Create edit form modal
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
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Add event listener to close button
    const closeButton = modal.querySelector('.close-modal');
    closeButton.addEventListener('click', function() {
        modal.remove();
    });
    
    // Close modal when clicking outside of content
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    });
    
    // Handle form submission
    const editForm = document.getElementById('edit-item-form');
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm('edit-item-form')) {
            return;
        }
        
        // Get form data
        const formData = new FormData(this);
        
        // Find item index
        const itemIndex = menuItems.findIndex(item => item.id.toString() === itemId);
        
        if (itemIndex !== -1) {
            // Update item data
            menuItems[itemIndex].name = formData.get('item-name');
            menuItems[itemIndex].category_id = parseInt(formData.get('category'));
            menuItems[itemIndex].price = parseFloat(formData.get('price'));
            menuItems[itemIndex].description = formData.get('description');
            menuItems[itemIndex].is_available = formData.get('available') === 'on';
            
            // Save to localStorage
            localStorage.setItem('menuItems', JSON.stringify(menuItems));
            
            // Reload menu items
            loadMenuItems();
            
            // Close modal
            modal.remove();
            
            // Show success message
            alert('Menu item updated successfully');
        }
    });
}

function deleteMenuItem(itemId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this menu item?')) {
        return;
    }
    
    // Get menu items
    let menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    
    // Remove item
    menuItems = menuItems.filter(item => item.id.toString() !== itemId);
    
    // Save to localStorage
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    
    // Reload menu items
    loadMenuItems();
    
    // Show success message
    alert('Menu item deleted successfully');
}

function initializeOrderManagement() {
    // Load all orders
    loadOrders();
    
    // Add event listener to filter dropdown
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            loadOrders(this.value);
        });
    }
}

function loadOrders(statusFilter = 'all') {
    // Get all orders
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Apply status filter
    if (statusFilter !== 'all') {
        orders = orders.filter(order => order.status === statusFilter);
    }
    
    // Sort by date (newest first)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Update orders table
    const ordersTable = document.getElementById('orders-table');
    
    if (ordersTable) {
        const tableBody = ordersTable.querySelector('tbody');
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            if (orders.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `
                    <td colspan="7" class="empty-table">No orders found</td>
                `;
                tableBody.appendChild(emptyRow);
                return;
            }
            
            orders.forEach(order => {
                const date = new Date(order.date).toLocaleDateString('en-US');
                const time = new Date(order.date).toLocaleTimeString('en-US');
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#${order.id}</td>
                    <td>${order.customer.name}</td>
                    <td>${order.orderType}</td>
                    <td>$${order.total.toFixed(2)}</td>
                    <td>
                        <span class="status ${order.status}">${order.status}</span>
                    </td>
                    <td>${date}<br>${time}</td>
                    <td>
                        <button class="action-btn view-btn" data-id="${order.id}">View</button>
                        <button class="action-btn update-btn" data-id="${order.id}">Update</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to action buttons
            const viewButtons = tableBody.querySelectorAll('.view-btn');
            const updateButtons = tableBody.querySelectorAll('.update-btn');
            
            viewButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-id');
                    viewOrderDetails(orderId);
                });
            });
            
            updateButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-id');
                    updateOrderStatus(orderId);
                });
            });
        }
    }
}

function viewOrderDetails(orderId) {
    // Get all orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Find order
    const order = orders.find(order => order.id.toString() === orderId);
    
    if (!order) return;
    
    // Create modal for order details
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Format date
    const orderDate = new Date(order.date);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });
    
    // Generate items HTML
    let itemsHTML = '';
    order.items.forEach(item => {
        itemsHTML += `
            <div class="order-detail-item">
                <div class="item-name">${item.quantity}x ${item.name}</div>
                <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Order Details #${order.id}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="order-details">
                    <div class="order-info">
                        <p><strong>Date:</strong> ${formattedDate}</p>
                        <p><strong>Status:</strong> <span class="status ${order.status}">${order.status}</span></p>
                        <p><strong>Order Type:</strong> ${order.orderType}</p>
                    </div>
                    
                    <div class="customer-info">
                        <h3>Customer Information</h3>
                        <p><strong>Name:</strong> ${order.customer.name}</p>
                        <p><strong>Email:</strong> ${order.customer.email}</p>
                        <p><strong>Phone:</strong> ${order.customer.phone}</p>
                        ${order.orderType === 'delivery' ? `
                            <p><strong>Delivery Address:</strong> ${order.customer.address.street}, ${order.customer.address.city}, ${order.customer.address.province} ${order.customer.address.postal}</p>
                        ` : ''}
                    </div>
                    
                    <div class="order-items-details">
                        <h3>Items</h3>
                        ${itemsHTML}
                    </div>
                    
                    <div class="order-price-summary">
                        <div class="price-row">
                            <span>Subtotal</span>
                            <span>$${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="price-row">
                            <span>Tax</span>
                            <span>$${order.tax.toFixed(2)}</span>
                        </div>
                        <div class="price-row total">
                            <span>Total</span>
                            <span>$${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="order-actions">
                        <button class="btn primary-btn update-status-btn" data-id="${order.id}">Update Status</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Add event listener to close button
    const closeButton = modal.querySelector('.close-modal');
    closeButton.addEventListener('click', function() {
        modal.remove();
    });
    
    // Close modal when clicking outside of content
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    });
    
    // Add event listener to update status button
    const updateStatusBtn = modal.querySelector('.update-status-btn');
    updateStatusBtn.addEventListener('click', function() {
        modal.remove();
        updateOrderStatus(orderId);
    });
}

function updateOrderStatus(orderId) {
    // Get all orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Find order
    const order = orders.find(order => order.id.toString() === orderId);
    
    if (!order) return;
    
    // Create modal for status update
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Update Order Status #${order.id}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="update-status-form" class="admin-form">
                    <div class="form-group">
                        <label for="order-status">Status</label>
                        <select id="order-status" name="status" required>
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                            <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready for Pickup/Delivery</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered/Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="status-notes">Notes (Optional)</label>
                        <textarea id="status-notes" name="notes" rows="3"></textarea>
                    </div>
                    
                    <button type="submit" class="btn primary-btn">Update Status</button>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Add event listener to close button
    const closeButton = modal.querySelector('.close-modal');
    closeButton.addEventListener('click', function() {
        modal.remove();
    });
    
    // Close modal when clicking outside of content
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    });
    
    // Handle form submission
    const updateForm = document.getElementById('update-status-form');
    updateForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const newStatus = formData.get('status');
        const notes = formData.get('notes');
        
        // Find order index
        const orderIndex = orders.findIndex(o => o.id.toString() === orderId);
        
        if (orderIndex !== -1) {
            // Update order status
            orders[orderIndex].status = newStatus;
            
            // Add status history if not exists
            if (!orders[orderIndex].statusHistory) {
                orders[orderIndex].statusHistory = [];
            }
            
            // Add to status history
            orders[orderIndex].statusHistory.push({
                status: newStatus,
                date: new Date().toISOString(),
                notes: notes
            });
            
            // Save to localStorage
            localStorage.setItem('orders', JSON.stringify(orders));
            
            // Reload orders
            loadOrders();
            
            // Close modal
            modal.remove();
            
            // Show success message
            alert('Order status updated successfully');
        }
    });
}

function initializeUserManagement() {
    // Load all users
    loadUsers();
    
    // Initialize add user form
    const addUserForm = document.getElementById('add-user-form');
    
    if (addUserForm) {
        addUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm('add-user-form')) {
                return;
            }
            
            // Get form data
            const formData = new FormData(this);
            
            // Create new user
            const newUser = {
                id: Date.now().toString(),
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                role: formData.get('role'),
                createdAt: new Date().toISOString()
            };
            
            // Get existing users
            let users = JSON.parse(localStorage.getItem('users')) || [];
            
            // Check if email already exists
            if (users.some(user => user.email === newUser.email)) {
                alert('Email already exists');
                return;
            }
            
            // Check if username already exists
            if (users.some(user => user.username === newUser.username)) {
                alert('Username already exists');
                return;
            }
            
            // Add new user
            users.push(newUser);
            
            // Save to localStorage
            localStorage.setItem('users', JSON.stringify(users));
            
            // Reload users
            loadUsers();
            
            // Reset form
            this.reset();
            
            // Show success message
            alert('User added successfully');
        });
    }
}

function loadUsers() {
    // Get all users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Update users table
    const usersTable = document.getElementById('users-table');
    
    if (usersTable) {
        const tableBody = usersTable.querySelector('tbody');
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            users.forEach(user => {
                const createdDate = new Date(user.createdAt).toLocaleDateString('en-US');
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${createdDate}</td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${user.id}">Edit</button>
                        <button class="action-btn delete-btn" data-id="${user.id}">Delete</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to action buttons
            const editButtons = tableBody.querySelectorAll('.edit-btn');
            const deleteButtons = tableBody.querySelectorAll('.delete-btn');
            
            editButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const userId = this.getAttribute('data-id');
                    editUser(userId);
                });
            });
            
            deleteButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const userId = this.getAttribute('data-id');
                    deleteUser(userId);
                });
            });
        }
    }
}

function editUser(userId) {
    // Get all users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Find user
    const user = users.find(user => user.id === userId);
    
    if (!user) return;
    
    function editUser(userId) {
        // Get all users
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Find user
        const user = users.find(user => user.id === userId);
        
        if (!user) return;
        
        // Create edit form modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit User</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-user-form" class="admin-form">
                        <div class="form-group">
                            <label for="edit-username">Username</label>
                            <input type="text" id="edit-username" name="username" value="${user.username}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-email">Email</label>
                            <input type="email" id="edit-email" name="email" value="${user.email}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-password">New Password (leave blank to keep current)</label>
                            <input type="password" id="edit-password" name="password">
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-role">Role</label>
                            <select id="edit-role" name="role" required>
                                <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                                <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        
                        <button type="submit" class="btn primary-btn">Save Changes</button>
                    </form>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Add event listener to close button
        const closeButton = modal.querySelector('.close-modal');
        closeButton.addEventListener('click', function() {
            modal.remove();
        });
        
        // Close modal when clicking outside of content
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.remove();
            }
        });
        
        // Handle form submission
        const editForm = document.getElementById('edit-user-form');
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm('edit-user-form')) {
                return;
            }
            
            // Get form data
            const formData = new FormData(this);
            const username = formData.get('username');
            const email = formData.get('email');
            const password = formData.get('password');
            const role = formData.get('role');
            
            // Check if email already exists (excluding current user)
            if (email !== user.email && users.some(u => u.email === email)) {
                alert('Email already exists');
                return;
            }
            
            // Check if username already exists (excluding current user)
            if (username !== user.username && users.some(u => u.username === username)) {
                alert('Username already exists');
                return;
            }
            
            // Find user index
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex !== -1) {
                // Update user data
                users[userIndex].username = username;
                users[userIndex].email = email;
                users[userIndex].role = role;
                
                // Update password if provided
                if (password) {
                    users[userIndex].password = password;
                }
                
                // Save to localStorage
                localStorage.setItem('users', JSON.stringify(users));
                
                // Reload users
                loadUsers();
                
                // Close modal
                modal.remove();
                
                // Show success message
                alert('User updated successfully');
            }
        });
    }
    
    function deleteUser(userId) {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }
        
        // Get all users
        let users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Remove user
        users = users.filter(user => user.id !== userId);
        
        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        // Reload users
        loadUsers();
        
        // Show success message
        alert('User deleted successfully');
    }
}