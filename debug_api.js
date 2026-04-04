const axios = require('axios');

async function debugRequest() {
    console.log('--- ĐANG KIỂM TRA KẾT NỐI API ---');
    const API_URL = 'http://localhost:5000/api/designs';
    
    // Giả lập dữ liệu siêu nhỏ để xem server có sống không
    const mockData = {
        views: { front: { type: 'test' } },
        viewPreviews: { front: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' },
        viewTechniques: { front: 'embroidery' },
        totalPrice: 100000,
        options: { shape: 'rect' }
    };

    try {
        const response = await axios.post(API_URL, mockData);
        console.log('Thành công! Phản hồi từ server:', response.data);
    } catch (error) {
        console.error('THẤT BẠI! Mã lỗi:', error.response ? error.response.status : 'No Response');
        if (error.response && error.response.data) {
            console.error('Chi tiết lỗi từ Server:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Lỗi Axios:', error.message);
        }
    }
}

debugRequest();
