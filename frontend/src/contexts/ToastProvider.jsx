import { createContext, useState, useContext } from "react";

// ✅ Create the ToastContext
export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <ToastContext.Provider value={{ toast, showToast }}>
            {children}
        </ToastContext.Provider>
    );
};

// ✅ Correctly export useToast
export const useToast = () => useContext(ToastContext);
