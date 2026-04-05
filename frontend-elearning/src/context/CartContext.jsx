import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Lấy giỏ hàng từ LocalStorage (nếu có), nếu không thì tạo mảng rỗng
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Mỗi khi giỏ hàng thay đổi, tự động lưu lại vào LocalStorage
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    // Hàm thêm khóa học vào giỏ
    const addToCart = (course) => {
        setCart((prevCart) => {
            // Kiểm tra xem khóa học đã có trong giỏ chưa
            const isExist = prevCart.find((item) => item.id === course.id);
            if (isExist) {
                toast.error('Khóa học này đã có trong giỏ hàng!');
                return prevCart;
            }
            toast.success('Đã thêm vào giỏ hàng thành công!');
            return [...prevCart, course];
        });
    };

    // Hàm xóa khóa học khỏi giỏ
    const removeFromCart = (courseId) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== courseId));
        toast.success('Đã xóa khỏi giỏ hàng!');
    };

    // Hàm xóa nhiều khóa học khỏi giỏ
    const removeMultipleFromCart = (courseIdsToRemove) => {
        setCart((prevCart) => prevCart.filter((item) => !courseIdsToRemove.includes(item.id)));
    };

    // Hàm dọn sạch giỏ hàng (Dùng sau khi thanh toán thành công)
    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, removeMultipleFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

// Hook tùy chỉnh để sử dụng giỏ hàng cho tiện
export const useCart = () => useContext(CartContext);