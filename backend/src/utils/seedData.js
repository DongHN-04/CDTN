const Ingredient = require('../models/Ingredient');
const MenuItem = require('../models/MenuItem');
const Combo = require('../models/Combo');
const Promotion = require('../models/Promotion');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Banner = require('../models/Banner');
const Shift = require('../models/Shift');
const Order = require('../models/Order');
const Purchase = require('../models/Purchase');
const User = require('../models/User');

/**
 * Seed dữ liệu mẫu cho toàn bộ hệ thống:
 * - Nguyên liệu (Ingredients)
 * - Món ăn (MenuItems) với đầy đủ category và hình ảnh
 * - Combo
 * - Khuyến mãi (Promotions)
 * - Nhà cung cấp (Suppliers)
 * - Khách lẻ (Customers)
 * - Banners quảng cáo
 * - Ca làm việc (Shifts)
 * - Phiếu nhập hàng (Purchases)
 * - Đơn hàng (Orders)
 *
 * Chỉ thêm những phần tử chưa tồn tại trong database (không xóa/sửa dữ liệu cũ).
 */
const seedData = async () => {
  try {
    console.log('🌱 Bắt đầu seed toàn bộ dữ liệu mẫu (chế độ bảo toàn dữ liệu)...');

    // ========================
    // 1. TẠO NGUYÊN LIỆU (INGREDIENTS)
    // ========================
    const ingredientData = [
      { name: 'Thịt bò xay', stock: 50, unit: 'kg', pricePerUnit: 250000 },
      { name: 'Bánh mì hamburger', stock: 200, unit: 'cái', pricePerUnit: 5000 },
      { name: 'Phô mai cheddar', stock: 100, unit: 'miếng', pricePerUnit: 8000 },
      { name: 'Xà lách', stock: 30, unit: 'kg', pricePerUnit: 25000 },
      { name: 'Cà chua', stock: 25, unit: 'kg', pricePerUnit: 30000 },
      { name: 'Hành tây', stock: 20, unit: 'kg', pricePerUnit: 20000 },
      { name: 'Sốt mayonnaise', stock: 15, unit: 'lít', pricePerUnit: 60000 },
      { name: 'Sốt cà chua', stock: 15, unit: 'lít', pricePerUnit: 40000 },
      { name: 'Thịt gà', stock: 40, unit: 'kg', pricePerUnit: 120000 },
      { name: 'Bột chiên giòn', stock: 20, unit: 'kg', pricePerUnit: 35000 },
      { name: 'Dầu ăn', stock: 30, unit: 'lít', pricePerUnit: 45000 },
      { name: 'Khoai tây', stock: 50, unit: 'kg', pricePerUnit: 25000 },
      { name: 'Bột pizza', stock: 20, unit: 'kg', pricePerUnit: 40000 },
      { name: 'Phô mai mozzarella', stock: 30, unit: 'kg', pricePerUnit: 280000 },
      { name: 'Pepperoni', stock: 10, unit: 'kg', pricePerUnit: 350000 },
      { name: 'Tôm', stock: 15, unit: 'kg', pricePerUnit: 300000 },
      { name: 'Mực', stock: 10, unit: 'kg', pricePerUnit: 250000 },
      { name: 'Ớt chuông', stock: 10, unit: 'kg', pricePerUnit: 50000 },
      { name: 'Bánh mì sandwich', stock: 100, unit: 'cái', pricePerUnit: 4000 },
      { name: 'Sốt cay sriracha', stock: 10, unit: 'lít', pricePerUnit: 80000 },
      { name: 'Dưa chuột muối', stock: 8, unit: 'kg', pricePerUnit: 30000 },
      { name: 'Cánh gà', stock: 30, unit: 'kg', pricePerUnit: 110000 },
      { name: 'Nước mắm', stock: 10, unit: 'lít', pricePerUnit: 50000 },
      { name: 'Đường', stock: 20, unit: 'kg', pricePerUnit: 20000 },
      { name: 'Sữa tươi', stock: 20, unit: 'lít', pricePerUnit: 35000 },
      { name: 'Bơ (quả)', stock: 15, unit: 'kg', pricePerUnit: 80000 },
      { name: 'Kem vani', stock: 10, unit: 'kg', pricePerUnit: 150000 },
      { name: 'Trứng gà', stock: 100, unit: 'quả', pricePerUnit: 4000 },
      { name: 'Caramel', stock: 5, unit: 'lít', pricePerUnit: 90000 },
      { name: 'Coca Cola', stock: 200, unit: 'lon', pricePerUnit: 8000 },
      { name: 'Trà đào', stock: 50, unit: 'lít', pricePerUnit: 30000 },
      { name: 'Bacon', stock: 10, unit: 'kg', pricePerUnit: 280000 },
    ];

    let newIngredientsCount = 0;
    for (const ingItem of ingredientData) {
      const exists = await Ingredient.findOne({ name: ingItem.name });
      if (!exists) {
        await Ingredient.create(ingItem);
        newIngredientsCount++;
      }
    }
    if (newIngredientsCount > 0) {
      console.log(`  ✅ Đã thêm ${newIngredientsCount} nguyên liệu mẫu mới`);
    } else {
      console.log('  ℹ️ Các nguyên liệu mẫu đều đã tồn tại, không thêm mới');
    }

    // Lấy tất cả ingredients từ DB để ánh xạ tên -> ID
    const ingredients = await Ingredient.find({});
    const ing = {};
    ingredients.forEach(i => { ing[i.name] = i._id; });

    // ========================
    // 2. TẠO MÓN ĂN (MENU ITEMS)
    // ========================
    const menuItemsData = [
      // -------- BURGER --------
      {
        name: 'Burger Bò Đặc Biệt',
        price: 85000,
        description: 'Hai lớp thịt bò tươi mọng nước, với phô mai tan chảy, xà lách tươi, cà chua và sốt đặc biệt. Món ăn signature của Sơn Đông.',
        category: 'Burger',
        image: '/images/home/product-burger.png',
        ingredients: [
          { ingredient: ing['Thịt bò xay'], quantity: 0.2 },
          { ingredient: ing['Bánh mì hamburger'], quantity: 1 },
          { ingredient: ing['Phô mai cheddar'], quantity: 2 },
          { ingredient: ing['Xà lách'], quantity: 0.05 },
          { ingredient: ing['Cà chua'], quantity: 0.05 },
          { ingredient: ing['Sốt mayonnaise'], quantity: 0.03 },
        ],
      },
      {
        name: 'Burger Gà Giòn',
        price: 65000,
        description: 'Gà chiên giòn rụm kẹp trong bánh mì mềm với xà lách tươi và sốt mayo tự pha.',
        category: 'Burger',
        image: '/images/home/product-sandwich.png',
        ingredients: [
          { ingredient: ing['Thịt gà'], quantity: 0.15 },
          { ingredient: ing['Bột chiên giòn'], quantity: 0.05 },
          { ingredient: ing['Bánh mì hamburger'], quantity: 1 },
          { ingredient: ing['Xà lách'], quantity: 0.03 },
          { ingredient: ing['Sốt mayonnaise'], quantity: 0.03 },
        ],
      },
      {
        name: 'Burger Phô Mai Đôi',
        price: 95000,
        description: 'Double cheese burger với 2 lớp phô mai cheddar, bacon giòn và hành tây caramel hóa.',
        category: 'Burger',
        image: '/images/home/product-burger.png',
        ingredients: [
          { ingredient: ing['Thịt bò xay'], quantity: 0.25 },
          { ingredient: ing['Bánh mì hamburger'], quantity: 1 },
          { ingredient: ing['Phô mai cheddar'], quantity: 4 },
          { ingredient: ing['Bacon'], quantity: 0.05 },
          { ingredient: ing['Hành tây'], quantity: 0.03 },
        ],
      },

      // -------- GÀ RÁN --------
      {
        name: 'Gà Rán Giòn (3 miếng)',
        price: 99000,
        description: '3 miếng gà rán giòn đặc trưng, ăn cùng khoai tây chiên giòn tan. Tẩm ướp gia vị bí truyền.',
        category: 'Gà Rán',
        image: '/images/home/product-chicken.png',
        ingredients: [
          { ingredient: ing['Thịt gà'], quantity: 0.35 },
          { ingredient: ing['Bột chiên giòn'], quantity: 0.08 },
          { ingredient: ing['Dầu ăn'], quantity: 0.1 },
          { ingredient: ing['Khoai tây'], quantity: 0.15 },
        ],
      },
      {
        name: 'Cánh Gà Chiên Mắm',
        price: 79000,
        description: 'Cánh gà chiên giòn tẩm sốt nước mắm tỏi ớt cay ngọt, ăn kèm rau sống.',
        category: 'Gà Rán',
        image: '/images/home/product-chicken.png',
        ingredients: [
          { ingredient: ing['Cánh gà'], quantity: 0.3 },
          { ingredient: ing['Bột chiên giòn'], quantity: 0.05 },
          { ingredient: ing['Dầu ăn'], quantity: 0.08 },
          { ingredient: ing['Nước mắm'], quantity: 0.03 },
        ],
      },
      {
        name: 'Gà Rán Sốt Cay',
        price: 89000,
        description: 'Gà rán giòn phủ sốt cay nồng đặc biệt, dành cho tín đồ ăn cay. Kèm khoai tây lắc phô mai.',
        category: 'Gà Rán',
        image: '/images/home/product-chicken.png',
        ingredients: [
          { ingredient: ing['Thịt gà'], quantity: 0.3 },
          { ingredient: ing['Bột chiên giòn'], quantity: 0.06 },
          { ingredient: ing['Dầu ăn'], quantity: 0.08 },
          { ingredient: ing['Sốt cay sriracha'], quantity: 0.05 },
          { ingredient: ing['Khoai tây'], quantity: 0.12 },
        ],
      },

      // -------- PIZZA --------
      {
        name: 'Pizza Pepperoni',
        price: 145000,
        description: 'Pizza cỡ lớn phủ đầy các lát pepperoni và hỗn hợp phô mai mozzarella tan chảy. Đế giòn mỏng.',
        category: 'Pizza',
        image: '/images/home/product-pizza.png',
        ingredients: [
          { ingredient: ing['Bột pizza'], quantity: 0.3 },
          { ingredient: ing['Sốt cà chua'], quantity: 0.1 },
          { ingredient: ing['Phô mai mozzarella'], quantity: 0.15 },
          { ingredient: ing['Pepperoni'], quantity: 0.1 },
        ],
      },
      {
        name: 'Pizza Hải Sản',
        price: 165000,
        description: 'Pizza hải sản thượng hạng với tôm, mực, ớt chuông trên nền phô mai béo ngậy.',
        category: 'Pizza',
        image: '/images/home/product-pizza.png',
        ingredients: [
          { ingredient: ing['Bột pizza'], quantity: 0.3 },
          { ingredient: ing['Sốt cà chua'], quantity: 0.1 },
          { ingredient: ing['Phô mai mozzarella'], quantity: 0.15 },
          { ingredient: ing['Tôm'], quantity: 0.1 },
          { ingredient: ing['Mực'], quantity: 0.08 },
          { ingredient: ing['Ớt chuông'], quantity: 0.05 },
        ],
      },
      {
        name: 'Pizza 4 Phô Mai',
        price: 155000,
        description: 'Sự kết hợp hoàn hảo của 4 loại phô mai: Mozzarella, Cheddar, Parmesan và Cream Cheese.',
        category: 'Pizza',
        image: '/images/home/product-pizza.png',
        ingredients: [
          { ingredient: ing['Bột pizza'], quantity: 0.3 },
          { ingredient: ing['Sốt cà chua'], quantity: 0.08 },
          { ingredient: ing['Phô mai mozzarella'], quantity: 0.2 },
          { ingredient: ing['Phô mai cheddar'], quantity: 3 },
        ],
      },

      // -------- SANDWICH --------
      {
        name: 'Sandwich Gà Cay',
        price: 75000,
        description: 'Gà giòn phủ sốt ớt cay nồng, ăn kèm dưa chuột muối và rau sống trong bánh mì nướng giòn.',
        category: 'Burger',
        image: '/images/home/product-sandwich.png',
        ingredients: [
          { ingredient: ing['Thịt gà'], quantity: 0.15 },
          { ingredient: ing['Bột chiên giòn'], quantity: 0.04 },
          { ingredient: ing['Bánh mì sandwich'], quantity: 1 },
          { ingredient: ing['Sốt cay sriracha'], quantity: 0.03 },
          { ingredient: ing['Dưa chuột muối'], quantity: 0.03 },
          { ingredient: ing['Xà lách'], quantity: 0.03 },
        ],
      },

      // -------- ĐỒ UỐNG --------
      {
        name: 'Coca Cola',
        price: 20000,
        description: 'Coca Cola lon lạnh 330ml, tươi mát sảng khoái.',
        category: 'Đồ Uống',
        image: '/images/home/product-cola.png',
        ingredients: [
          { ingredient: ing['Coca Cola'], quantity: 1 },
        ],
      },
      {
        name: 'Trà Đào Cam Sả',
        price: 35000,
        description: 'Trà đào thơm ngát kết hợp cam tươi và sả, vị thanh mát tự nhiên.',
        category: 'Đồ Uống',
        image: '/images/home/product-peachtea.png',
        ingredients: [
          { ingredient: ing['Trà đào'], quantity: 0.3 },
          { ingredient: ing['Đường'], quantity: 0.02 },
        ],
      },
      {
        name: 'Sinh Tố Bơ',
        price: 45000,
        description: 'Sinh tố bơ béo ngậy, thơm lừng, blend cùng sữa tươi và đá xay mịn.',
        category: 'Đồ Uống',
        image: '/images/home/product-avocado.png',
        ingredients: [
          { ingredient: ing['Bơ (quả)'], quantity: 0.15 },
          { ingredient: ing['Sữa tươi'], quantity: 0.2 },
          { ingredient: ing['Đường'], quantity: 0.02 },
        ],
      },

      // -------- TRÁNG MIỆNG --------
      {
        name: 'Kem Vani Sốt Caramel',
        price: 30000,
        description: 'Kem vani mịn màng phủ sốt caramel vàng óng, topping bánh quy giòn.',
        category: 'Tráng Miệng',
        image: '/images/home/product-vanillaice.png',
        ingredients: [
          { ingredient: ing['Kem vani'], quantity: 0.1 },
          { ingredient: ing['Caramel'], quantity: 0.03 },
        ],
      },
      {
        name: 'Bánh Flan Trứng',
        price: 25000,
        description: 'Bánh flan mềm mịn, vị trứng béo ngậy hòa quyện với caramel đắng nhẹ.',
        category: 'Tráng Miệng',
        image: '/images/home/product-flan.png',
        ingredients: [
          { ingredient: ing['Trứng gà'], quantity: 3 },
          { ingredient: ing['Sữa tươi'], quantity: 0.15 },
          { ingredient: ing['Đường'], quantity: 0.03 },
          { ingredient: ing['Caramel'], quantity: 0.02 },
        ],
      },
      {
        name: 'Khoai Tây Chiên',
        price: 35000,
        description: 'Khoai tây chiên giòn vàng, rắc muối và gia vị. Ăn kèm sốt cà chua hoặc mayo.',
        category: 'Khai Vị',
        image: '/images/home/product-fries.png',
        ingredients: [
          { ingredient: ing['Khoai tây'], quantity: 0.2 },
          { ingredient: ing['Dầu ăn'], quantity: 0.1 },
        ],
      },
    ];

    let newMenuItemsCount = 0;
    for (const item of menuItemsData) {
      const exists = await MenuItem.findOne({ name: item.name });
      if (!exists) {
        const cleanedIngredients = item.ingredients.filter(i => i.ingredient);
        await MenuItem.create({
          ...item,
          ingredients: cleanedIngredients
        });
        newMenuItemsCount++;
      }
    }

    if (newMenuItemsCount > 0) {
      console.log(`  ✅ Đã thêm ${newMenuItemsCount} món ăn mẫu mới`);
    } else {
      console.log('  ℹ️ Các món ăn mẫu đều đã tồn tại, không thêm mới');
    }

    // Lấy lại tất cả các món ăn trong DB để liên kết vào Combo và Order
    const allMenuItems = await MenuItem.find({});
    const menuMap = {};
    allMenuItems.forEach(m => { menuMap[m.name] = m._id; });

    // ========================
    // 3. TẠO COMBO (COMBOS)
    // ========================
    const burger = menuMap['Burger Bò Đặc Biệt'];
    const chicken = menuMap['Gà Rán Giòn (3 miếng)'];
    const fries = menuMap['Khoai Tây Chiên'];
    const cola = menuMap['Coca Cola'];
    const pizza = menuMap['Pizza Pepperoni'];
    const chickenCay = menuMap['Gà Rán Sốt Cay'];
    const tea = menuMap['Trà Đào Cam Sả'];

    if (burger && chicken && cola && fries) {
      const combosData = [
        {
          name: 'Combo Burger Couple',
          description: '2 Burger Bò Đặc Biệt + 2 Khoai Tây Chiên + 2 Coca Cola. Tiết kiệm 30,000₫!',
          items: [
            { menuItem: burger, quantity: 2 },
            { menuItem: fries, quantity: 2 },
            { menuItem: cola, quantity: 2 },
          ],
          price: 250000,
          image: '/images/home/product-burger.png',
          isActive: true,
        },
        {
          name: 'Combo Gia Đình',
          description: '1 Pizza Pepperoni + 3 Gà Rán Giòn + 2 Khoai Tây + 4 Coca Cola. Cho cả gia đình!',
          items: [
            { menuItem: pizza || burger, quantity: 1 },
            { menuItem: chicken, quantity: 1 },
            { menuItem: fries, quantity: 2 },
            { menuItem: cola, quantity: 4 },
          ],
          price: 399000,
          image: '/images/home/product-pizza.png',
          isActive: true,
        },
        {
          name: 'Combo Gà Cay Sốc',
          description: 'Gà Rán Sốt Cay + Khoai Tây Chiên + Trà Đào Cam Sả. Cho fan ăn cay!',
          items: [
            { menuItem: chickenCay || chicken, quantity: 1 },
            { menuItem: fries, quantity: 1 },
            { menuItem: tea || cola, quantity: 1 },
          ],
          price: 139000,
          image: '/images/home/product-chicken.png',
          isActive: true,
        },
      ];

      let newCombosCount = 0;
      for (const comboItem of combosData) {
        const exists = await Combo.findOne({ name: comboItem.name });
        if (!exists) {
          await Combo.create(comboItem);
          newCombosCount++;
        }
      }

      if (newCombosCount > 0) {
        console.log(`  ✅ Đã thêm ${newCombosCount} combo mẫu mới`);
      } else {
        console.log('  ℹ️ Các combo mẫu đều đã tồn tại, không thêm mới');
      }
    }

    // ========================
    // 4. TẠO KHUYẾN MÃI (PROMOTIONS)
    // ========================
    const promotionsData = [
      {
        name: 'Mừng Khai Trương',
        description: 'Giảm giá 15% cho tất cả các đơn hàng từ 100,000₫ chào mừng khai trương.',
        type: 'percent',
        value: 15,
        minOrderValue: 100000,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-12-31'),
        isActive: true,
      },
      {
        name: 'Cuối Tuần Vui Vẻ',
        description: 'Giảm ngay 20,000₫ cho hóa đơn từ 150,000₫ vào thứ Bảy và Chủ Nhật.',
        type: 'fixed',
        value: 20000,
        minOrderValue: 150000,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-12-31'),
        isActive: true,
      },
      {
        name: 'Voucher Siêu Cấp',
        description: 'Giảm ngay 50,000₫ cho hóa đơn khủng từ 300,000₫.',
        type: 'fixed',
        value: 50000,
        minOrderValue: 300000,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-12-31'),
        isActive: true,
      }
    ];

    let newPromotionsCount = 0;
    for (const promo of promotionsData) {
      const exists = await Promotion.findOne({ name: promo.name });
      if (!exists) {
        await Promotion.create(promo);
        newPromotionsCount++;
      }
    }
    if (newPromotionsCount > 0) {
      console.log(`  ✅ Đã thêm ${newPromotionsCount} khuyến mãi mẫu mới`);
    } else {
      console.log('  ℹ️ Các khuyến mãi mẫu đều đã tồn tại, không thêm mới');
    }

    // ========================
    // 5. TẠO NHÀ CUNG CẤP (SUPPLIERS)
    // ========================
    const suppliersData = [
      {
        name: 'Tổng kho Thực Phẩm Sơn Đông',
        contactPerson: 'Anh Đông',
        phone: '0988777666',
        email: 'kho.sondong@gmail.com',
        address: 'Thạch Thất, Hà Nội',
        debt: 0,
        notes: 'Cung cấp thịt bò xay, thịt gà, cánh gà tươi sống.',
        isActive: true,
      },
      {
        name: 'Công ty Nông Sản Sạch Ba Vì',
        contactPerson: 'Chị Hà',
        phone: '0911222333',
        email: 'nongsanbavi@cleanfood.vn',
        address: 'Ba Vì, Hà Nội',
        debt: 0,
        notes: 'Cung cấp rau xà lách, cà chua, hành tây tươi sạch hàng ngày.',
        isActive: true,
      },
      {
        name: 'Đại lý Nước giải khát Hùng Vương',
        contactPerson: 'Anh Hùng',
        phone: '0933444555',
        email: 'hungvuong.bev@gmail.com',
        address: 'Cầu Giấy, Hà Nội',
        debt: 0,
        notes: 'Cung cấp lon Coca Cola, chai nước lọc và đồ đóng chai.',
        isActive: true,
      }
    ];

    let newSuppliersCount = 0;
    for (const sup of suppliersData) {
      const exists = await Supplier.findOne({ name: sup.name });
      if (!exists) {
        await Supplier.create(sup);
        newSuppliersCount++;
      }
    }
    if (newSuppliersCount > 0) {
      console.log(`  ✅ Đã thêm ${newSuppliersCount} nhà cung cấp mẫu mới`);
    } else {
      console.log('  ℹ️ Các nhà cung cấp mẫu đều đã tồn tại, không thêm mới');
    }

    // ========================
    // 6. TẠO KHÁCH HÀNG (CUSTOMERS)
    // ========================
    const customersData = [
      {
        name: 'Nguyễn Văn Hải',
        phone: '0987654321',
        email: 'vanhai@gmail.com',
        type: 'Thường',
        notes: 'Khách hay đặt giao tận nơi vào buổi tối.',
        isActive: true,
      },
      {
        name: 'Phạm Minh Tuấn',
        phone: '0912345678',
        email: 'tuansd@yahoo.com',
        type: 'VIP',
        notes: 'Khách VIP, thường xuyên ăn tại cửa hàng.',
        isActive: true,
      },
      {
        name: 'Lê Thị Thuỷ',
        phone: '0977888999',
        email: 'thuy.le@outlook.com',
        type: 'Thường',
        notes: 'Ưa thích món Pizza Hải Sản.',
        isActive: true,
      }
    ];

    let newCustomersCount = 0;
    for (const cust of customersData) {
      const exists = await Customer.findOne({ phone: cust.phone });
      if (!exists) {
        await Customer.create(cust);
        newCustomersCount++;
      }
    }
    if (newCustomersCount > 0) {
      console.log(`  ✅ Đã thêm ${newCustomersCount} khách lẻ mẫu mới`);
    } else {
      console.log('  ℹ️ Các khách lẻ mẫu đều đã tồn tại, không thêm mới');
    }

    // ========================
    // 7. TẠO BANNERS (BANNERS)
    // ========================
    const bannersData = [
      {
        image: '/images/home/product-burger.png',
        title: 'Bùng nổ hương vị - Burger Bò đặc biệt giảm 15%',
        isActive: true,
      },
      {
        image: '/images/home/product-pizza.png',
        title: 'Món mới siêu ngon - Pizza Hải Sản Thượng Hạng',
        isActive: true,
      },
      {
        image: '/images/home/product-chicken.png',
        title: 'Gà Rán Giòn Rụm - Combo Siêu Tiết Kiệm',
        isActive: true,
      }
    ];

    let newBannersCount = 0;
    for (const banner of bannersData) {
      const exists = await Banner.findOne({ title: banner.title });
      if (!exists) {
        await Banner.create(banner);
        newBannersCount++;
      }
    }
    if (newBannersCount > 0) {
      console.log(`  ✅ Đã thêm ${newBannersCount} banner mẫu mới`);
    } else {
      console.log('  ℹ️ Các banner mẫu đều đã tồn tại, không thêm mới');
    }

    // ========================
    // 8. TẠO CA LÀM VIỆC (SHIFTS)
    // ========================
    const checkShifts = await Shift.countDocuments();
    if (checkShifts === 0) {
      const staffList = await User.find({ role: { $in: ['staff', 'admin'] } }).limit(2);
      const staffIds = staffList.map(s => s._id);

      const shiftsData = [
        {
          name: 'Ca Sáng (08:00 - 13:00)',
          startTime: new Date('2026-06-08T08:00:00Z'),
          endTime: new Date('2026-06-08T13:00:00Z'),
          staff: staffIds,
          status: 'closed',
          totalCash: 1200000,
          totalRevenue: 1200000,
          actualCash: 1200000,
          difference: 0,
          notes: 'Mở cửa thuận lợi, ca sáng ổn định.',
        },
        {
          name: 'Ca Chiều (13:00 - 18:00)',
          startTime: new Date('2026-06-08T13:00:00Z'),
          endTime: new Date('2026-06-08T18:00:00Z'),
          staff: staffIds,
          status: 'closed',
          totalCash: 2500000,
          totalRevenue: 2500000,
          actualCash: 2480000,
          difference: -20000,
          notes: 'Bù tiền thối thừa 20k.',
        },
        {
          name: 'Ca Tối (18:00 - 23:00)',
          startTime: new Date('2026-06-08T18:00:00Z'),
          endTime: new Date('2026-06-08T23:00:00Z'),
          staff: staffIds,
          status: 'open',
          totalCash: 1500000,
          totalRevenue: 1500000,
          actualCash: 0,
          difference: 0,
          notes: 'Ca làm việc đang diễn ra.',
        }
      ];

      await Shift.insertMany(shiftsData);
      console.log(`  ✅ Đã thêm ${shiftsData.length} ca làm việc mẫu mới`);
    } else {
      console.log('  ℹ️ Các ca làm việc đã tồn tại, không thêm mới');
    }

    // ========================
    // 9. TẠO PHIẾU NHẬP HÀNG (PURCHASES)
    // ========================
    const checkPurchases = await Purchase.countDocuments();
    const dbSuppliers = await Supplier.find({});
    const dbIngredients = await Ingredient.find({});

    if (checkPurchases === 0 && dbSuppliers.length > 0 && dbIngredients.length > 0) {
      const mainSupplier = dbSuppliers[0];
      const beefIng = dbIngredients.find(i => i.name === 'Thịt bò xay');
      const chickenIng = dbIngredients.find(i => i.name === 'Thịt gà');

      if (beefIng && chickenIng) {
        const purchaseData = {
          supplier: mainSupplier._id,
          items: [
            {
              ingredient: beefIng._id,
              quantity: 10,
              unitPrice: beefIng.pricePerUnit,
              totalPrice: 10 * beefIng.pricePerUnit
            },
            {
              ingredient: chickenIng._id,
              quantity: 15,
              unitPrice: chickenIng.pricePerUnit,
              totalPrice: 15 * chickenIng.pricePerUnit
            }
          ],
          totalAmount: (10 * beefIng.pricePerUnit) + (15 * chickenIng.pricePerUnit),
          paidAmount: (10 * beefIng.pricePerUnit) + (15 * chickenIng.pricePerUnit) - 500000,
          debtAfterPurchase: 500000,
          purchaseDate: new Date(),
          notes: 'Nhập thực phẩm tươi đầu tuần, nợ lại 500,000₫ thanh toán sau.'
        };

        await Purchase.create(purchaseData);
        mainSupplier.debt += 500000;
        await mainSupplier.save();

        console.log('  ✅ Đã thêm 1 phiếu nhập hàng mẫu mới và cập nhật công nợ nhà cung cấp');
      }
    } else {
      console.log('  ℹ️ Các phiếu nhập hàng đã tồn tại hoặc thiếu điều kiện nhà cung cấp/nguyên liệu');
    }

    // ========================
    // 10. TẠO ĐƠN HÀNG (ORDERS)
    // ========================
    const checkOrders = await Order.countDocuments();
    if (checkOrders === 0 && burger && fries && cola) {
      const staffUser = await User.findOne({ role: { $in: ['staff', 'admin'] } });

      const ordersData = [
        {
          customer: {
            name: 'Nguyễn Văn Hải',
            phone: '0987654321',
            email: 'vanhai@gmail.com',
            address: '123 Đường Láng, Hà Nội'
          },
          staff: staffUser ? staffUser._id : null,
          staffSnapshot: staffUser ? {
            name: staffUser.name,
            email: staffUser.email,
            role: staffUser.role,
            position: staffUser.position || 'Nhân viên',
            phone: staffUser.phone || ''
          } : undefined,
          items: [
            {
              menuItem: burger,
              name: 'Burger Bò Đặc Biệt',
              image: '/images/home/product-burger.png',
              category: 'Burger',
              quantity: 2,
              price: 85000
            },
            {
              menuItem: fries,
              name: 'Khoai Tây Chiên',
              image: '/images/home/product-fries.png',
              category: 'Khai Vị',
              quantity: 1,
              price: 35000
            }
          ],
          subtotal: 205000,
          deliveryFee: 15000,
          discount: 0,
          total: 220000,
          paymentMethod: 'cash',
          paymentStatus: 'paid',
          status: 'completed',
          notes: 'Giao hàng nhanh nhất có thể.',
          isCustomerOrder: true,
          completedAt: new Date()
        },
        {
          customer: {
            name: 'Khách lẻ bàn số 4',
            phone: '',
            email: '',
            address: ''
          },
          items: [
            {
              menuItem: burger,
              name: 'Burger Bò Đặc Biệt',
              image: '/images/home/product-burger.png',
              category: 'Burger',
              quantity: 1,
              price: 85000
            },
            {
              menuItem: cola,
              name: 'Coca Cola',
              image: '/images/home/product-cola.png',
              category: 'Đồ Uống',
              quantity: 1,
              price: 20000
            }
          ],
          subtotal: 105000,
          deliveryFee: 0,
          discount: 15000,
          promoCode: 'Mừng Khai Trương',
          total: 90000,
          paymentMethod: 'qr',
          paymentStatus: 'paid',
          status: 'completed',
          tableNumber: '4',
          isCustomerOrder: true,
          completedAt: new Date()
        },
        {
          customer: {
            name: 'Phạm Minh Tuấn',
            phone: '0912345678',
            email: 'tuansd@yahoo.com',
            address: ''
          },
          items: [
            {
              menuItem: burger,
              name: 'Burger Bò Đặc Biệt',
              image: '/images/home/product-burger.png',
              category: 'Burger',
              quantity: 1,
              price: 85000
            }
          ],
          subtotal: 85000,
          deliveryFee: 0,
          discount: 0,
          total: 85000,
          paymentMethod: 'cash',
          paymentStatus: 'unpaid',
          status: 'pending',
          tableNumber: '8',
          isCustomerOrder: true
        }
      ];

      await Order.insertMany(ordersData);
      console.log(`  ✅ Đã thêm ${ordersData.length} hóa đơn mẫu mới`);
    } else {
      console.log('  ℹ️ Đơn hàng đã tồn tại, không thêm mới');
    }

    console.log('🎉 Toàn bộ quá trình seed dữ liệu hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error.message);
  }
};

module.exports = seedData;
