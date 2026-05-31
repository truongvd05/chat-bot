let _io = null;

export const setIO = (io) => {
    _io = io;
};

export const getIO = () => {
    if (!_io) throw new Error("Socket.IO chưa được khởi tạo");
    return _io;
};
