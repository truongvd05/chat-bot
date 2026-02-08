function normalizeText(text) {
  return (
    text
      .toLowerCase()
      // bỏ dấu tiếng Việt
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // đổi số thành chữ hay bị lách
      .replace(/0/g, "o")
      .replace(/1/g, "i")
      .replace(/3/g, "e")
      .replace(/4/g, "a")
      .replace(/5/g, "s")
      .replace(/7/g, "t")
      // bỏ ký tự đặc biệt + khoảng trắng
      .replace(/[^a-z]/g, "")
  );
}

export default normalizeText;
