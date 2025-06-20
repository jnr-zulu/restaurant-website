-- Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'waffle_heaven_db')
BEGIN
    CREATE DATABASE waffle_heaven_db;
END;
GO

USE waffle_heaven_db;
GO

-- Users Table
CREATE TABLE users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
    created_at DATETIME DEFAULT GETDATE()
);

-- Categories Table
CREATE TABLE categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

-- Menu Items Table
CREATE TABLE menu_items (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    is_available BIT DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Orders Table
CREATE TABLE orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    order_date DATETIME DEFAULT GETDATE(),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    delivery_address TEXT,
    order_type VARCHAR(20) DEFAULT 'pickup' CHECK (order_type IN ('pickup', 'delivery', 'dine-in')),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Order Items Table
CREATE TABLE order_items (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT,
    item_id INT,
    quantity INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id)
);

-- Reservations Table
CREATE TABLE reservations (
    reservation_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    special_requests TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Insert Sample Data
GO

-- Sample Admin User (password: admin123)
INSERT INTO users (username, password, email, full_name, phone, role) VALUES
('admin', '$2y$10$8KyU7yOg5l3z0OT0CmpVReeZZ2Zrm20R8ybM9FBzVq.jZrk3D2Bri', 'admin@waffleheaven.com', 'Admin User', '0822166658', 'admin');

-- Sample Staff User (password: staff123)
INSERT INTO users (username, password, email, full_name, phone, role) VALUES
('staff', '$2y$10$g8QF58KMrWVIlv6K0v3z2eoqZHr1Bj6KUQxyCZS3n1T0c9E7.9VDO', 'staff@waffleheaven.com', 'Staff User', '0822166659', 'staff');

-- Sample Customer Users (password: password123)
INSERT INTO users (username, password, email, full_name, phone, address, role) VALUES
('john_doe', '$2y$10$DRVyPm7WgxVKdCHKx5WGt.JqKq5a1bEv0/sbPFIQyFUddXvKzuADW', 'john@example.com', 'John Doe', '0831234567', '123 Main St, White River, Mpumalanga', 'customer'),
('jane_smith', '$2y$10$DRVyPm7WgxVKdCHKx5WGt.JqKq5a1bEv0/sbPFIQyFUddXvKzuADW', 'jane@example.com', 'Jane Smith', '0847654321', '456 Oak Ave, White River, Mpumalanga', 'customer');

-- Sample Categories
INSERT INTO categories (name, description) VALUES
('Sweet Waffles', 'Delicious sweet waffles with various toppings'),
('Savory Waffles', 'Hearty savory waffles for breakfast or lunch'),
('Beverages', 'Hot and cold drinks to complement your waffles'),
('Combos', 'Special combinations at a discounted price');

-- Sample Menu Items
INSERT INTO menu_items (category_id, name, description, price, image_url, is_available) VALUES
-- Sweet Waffles
(1, 'Classic Maple', 'Traditional waffle with maple syrup and butter', 89.99, 'img/menu/classic-maple.jpg', 1),
(1, 'Chocolate Dream', 'Waffle topped with chocolate sauce, chocolate chips, and whipped cream', 99.99, 'img/menu/chocolate-dream.jpg', 1),
(1, 'Berry Bliss', 'Waffle with mixed berries, berry compote, and vanilla ice cream', 109.99, 'img/menu/berry-bliss.jpg', 1),
(1, 'Banana Nutella', 'Waffle with sliced bananas, Nutella, and crushed hazelnuts', 104.99, 'img/menu/banana-nutella.jpg', 1),

-- Savory Waffles
(2, 'Bacon & Egg', 'Waffle with crispy bacon, fried egg, and maple syrup', 119.99, 'img/menu/bacon-egg.jpg', 1),
(2, 'Chicken & Waffles', 'Golden waffle with crispy fried chicken and honey butter', 139.99, 'img/menu/chicken-waffles.jpg', 1),
(2, 'Avocado & Feta', 'Waffle with smashed avocado, crumbled feta, and cherry tomatoes', 129.99, 'img/menu/avocado-feta.jpg', 1),
(2, 'Ham & Cheese', 'Waffle with ham, melted cheese, and hollandaise sauce', 124.99, 'img/menu/ham-cheese.jpg', 1),

-- Beverages
(3, 'Coffee', 'Regular or decaf coffee', 39.99, 'img/menu/coffee.jpg', 1),
(3, 'Fresh Juice', 'Orange, apple, or mixed fruit juice', 45.99, 'img/menu/fresh-juice.jpg', 1),
(3, 'Milkshake', 'Chocolate, vanilla, or strawberry milkshake', 59.99, 'img/menu/milkshake.jpg', 1),
(3, 'Hot Chocolate', 'Rich and creamy hot chocolate with whipped cream', 49.99, 'img/menu/hot-chocolate.jpg', 1),

-- Combos
(4, 'Sweet Duo', 'Any sweet waffle with a coffee or juice', 119.99, 'img/menu/sweet-duo.jpg', 1),
(4, 'Savory Brunch', 'Any savory waffle with a coffee or juice', 149.99, 'img/menu/savory-brunch.jpg', 1),
(4, 'Family Feast', '4 waffles of your choice (2 sweet, 2 savory) and 4 beverages', 399.99, 'img/menu/family-feast.jpg', 1);

-- Sample Orders
INSERT INTO orders (user_id, total_amount, status, payment_status, delivery_address, order_type) VALUES
(3, 189.98, 'delivered', 'paid', '123 Main St, White River, Mpumalanga', 'delivery'),
(4, 149.99, 'confirmed', 'paid', '456 Oak Ave, White River, Mpumalanga', 'pickup');

-- Sample Order Items
INSERT INTO order_items (order_id, item_id, quantity, subtotal, special_instructions) VALUES
(1, 1, 1, 89.99, NULL),
(1, 9, 1, 39.99, 'Extra hot'),
(1, 10, 1, 45.99, NULL),
(2, 14, 1, 149.99, NULL);

-- Sample Reservations
INSERT INTO reservations (user_id, reservation_date, reservation_time, party_size, status, special_requests) VALUES
(3, '2025-03-25', '19:00', 4, 'confirmed', 'Window seat preferred'),
(4, '2025-03-28', '18:30', 2, 'pending', 'Anniversary celebration');