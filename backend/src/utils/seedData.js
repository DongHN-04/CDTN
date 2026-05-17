const Ingredient = require('../models/Ingredient');
const MenuItem = require('../models/MenuItem');
const Combo = require('../models/Combo');

/**
 * Seed dữ liệu mẫu cho hệ thống:
 * - Nguyên liệu (Ingredients)
 * - Món ăn (MenuItems) với đầy đủ category và hình ảnh
 * - Combo
 *
 * Chỉ chạy khi DB chưa có dữ liệu menu.
 */
const seedData = async () => {
  try {
    // Kiểm tra xem đã có dữ liệu chưa
    const menuCount = await MenuItem.countDocuments();
    if (menuCount > 0) {
      console.log('✅ Dữ liệu menu đã tồn tại, bỏ qua seed.');
      return;
    }

    console.log('🌱 Bắt đầu seed dữ liệu mẫu...');

    // ========================
    // 1. TẠO NGUYÊN LIỆU
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

    // Xóa ingredients cũ nếu có, để tránh trùng lặp
    const existingIngredientCount = await Ingredient.countDocuments();
    if (existingIngredientCount === 0) {
      await Ingredient.insertMany(ingredientData);
      console.log(`  ✅ Đã tạo ${ingredientData.length} nguyên liệu`);
    }

    // Lấy lại ingredients từ DB để có _id
    const ingredients = await Ingredient.find({});
    const ing = {};
    ingredients.forEach(i => { ing[i.name] = i._id; });

    // ========================
    // 2. TẠO MENU ITEMS
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
        image: '',
        ingredients: [
          { ingredient: ing['Coca Cola'], quantity: 1 },
        ],
      },
      {
        name: 'Trà Đào Cam Sả',
        price: 35000,
        description: 'Trà đào thơm ngát kết hợp cam tươi và sả, vị thanh mát tự nhiên.',
        category: 'Đồ Uống',
        image: '',
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
        image: '',
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
        image: '',
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
        image: '',
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
        image: '',
        ingredients: [
          { ingredient: ing['Khoai tây'], quantity: 0.2 },
          { ingredient: ing['Dầu ăn'], quantity: 0.1 },
        ],
      },
    ];

    // Lọc bỏ những ingredient ref bị undefined (nếu thiếu nguyên liệu)
    const cleanedMenuItems = menuItemsData.map(item => ({
      ...item,
      ingredients: item.ingredients.filter(i => i.ingredient),
    }));

    const createdMenuItems = await MenuItem.insertMany(cleanedMenuItems);
    console.log(`  ✅ Đã tạo ${createdMenuItems.length} món ăn`);

    // ========================
    // 3. TẠO COMBO
    // ========================
    const burger = createdMenuItems.find(m => m.name === 'Burger Bò Đặc Biệt');
    const chicken = createdMenuItems.find(m => m.name === 'Gà Rán Giòn (3 miếng)');
    const fries = createdMenuItems.find(m => m.name === 'Khoai Tây Chiên');
    const cola = createdMenuItems.find(m => m.name === 'Coca Cola');
    const pizza = createdMenuItems.find(m => m.name === 'Pizza Pepperoni');
    const chickenCay = createdMenuItems.find(m => m.name === 'Gà Rán Sốt Cay');
    const tea = createdMenuItems.find(m => m.name === 'Trà Đào Cam Sả');
    const iceCream = createdMenuItems.find(m => m.name === 'Kem Vani Sốt Caramel');

    const comboCount = await Combo.countDocuments();
    if (comboCount === 0 && burger && chicken && cola && fries) {
      const combosData = [
        {
          name: 'Combo Burger Couple',
          description: '2 Burger Bò Đặc Biệt + 2 Khoai Tây Chiên + 2 Coca Cola. Tiết kiệm 30,000₫!',
          items: [
            { menuItem: burger._id, quantity: 2 },
            { menuItem: fries._id, quantity: 2 },
            { menuItem: cola._id, quantity: 2 },
          ],
          price: 250000,
          image: '/images/home/product-burger.png',
          isActive: true,
        },
        {
          name: 'Combo Gia Đình',
          description: '1 Pizza Pepperoni + 3 Gà Rán Giòn + 2 Khoai Tây + 4 Coca Cola. Cho cả gia đình!',
          items: [
            { menuItem: pizza?._id || burger._id, quantity: 1 },
            { menuItem: chicken._id, quantity: 1 },
            { menuItem: fries._id, quantity: 2 },
            { menuItem: cola._id, quantity: 4 },
          ],
          price: 399000,
          image: '/images/home/product-pizza.png',
          isActive: true,
        },
        {
          name: 'Combo Gà Cay Sốc',
          description: 'Gà Rán Sốt Cay + Khoai Tây Chiên + Trà Đào Cam Sả. Cho fan ăn cay!',
          items: [
            { menuItem: chickenCay?._id || chicken._id, quantity: 1 },
            { menuItem: fries._id, quantity: 1 },
            { menuItem: tea?._id || cola._id, quantity: 1 },
          ],
          price: 139000,
          image: '/images/home/product-chicken.png',
          isActive: true,
        },
      ];

      await Combo.insertMany(combosData);
      console.log(`  ✅ Đã tạo ${combosData.length} combo`);
    }

    console.log('🎉 Seed dữ liệu mẫu hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error.message);
  }
};

module.exports = seedData;
