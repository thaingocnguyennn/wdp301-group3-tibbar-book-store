import { useState, useEffect } from 'react';
import { bookApi } from '../../api/bookApi';
import { categoryApi } from '../../api/categoryApi';

const BooksManagement = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [ebookFile, setEbookFile] = useState(null);
  const [ebookInputKey, setEbookInputKey] = useState(0);
  const [showPreviewForm, setShowPreviewForm] = useState(false); //state de dieu khien viec hien thi form quan ly preview
  const [previewBook, setPreviewBook] = useState(null); //khoi tao state de luu tru sach dang duoc chon de quan ly preview
  const [previewFiles, setPreviewFiles] = useState([]); //state de luu tru cac file anh preview duoc chon trong form quan ly preview
  const [previewInputKey, setPreviewInputKey] = useState(0); //state de reset input file khi dong mo form quan ly preview
  const [insertPageNumber, setInsertPageNumber] = useState(1);
  const [replacePageNumber, setReplacePageNumber] = useState(1);
  const [deletePageNumber, setDeletePageNumber] = useState(1);
  const [insertPreviewFile, setInsertPreviewFile] = useState(null);
  const [replacePreviewFile, setReplacePreviewFile] = useState(null);
  const [insertFileKey, setInsertFileKey] = useState(0);
  const [replaceFileKey, setReplaceFileKey] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    imageUrl: '',
    isbn: '',
    publishedDate: '',
    visibility: 'public',
    isEbook: false
  });
  const [message, setMessage] = useState('');
  // Lấy URL cơ sở của API từ biến môi trường và loại bỏ phần "/api" nếu có
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverBaseUrl = apiBase.replace(/\/api\/?$/, '');

  // Fetch sách và danh mục khi component được mount
  useEffect(() => {
    // Khi component được mount, ta sẽ gọi API để lấy danh sách sách và danh mục
    fetchBooks();
    // Đồng thời, ta cũng gọi API để lấy danh sách các thể loại sách có sẵn
    fetchCategories();
  }, []);

  // Hàm để gọi API lấy danh sách sách dành cho admin
  const fetchBooks = async () => {
    try {
      // Gọi API để lấy tất cả sách dành cho admin
      const response = await bookApi.getAllBooksAdmin();
      // Nếu thành công, ta sẽ cập nhật state 'books' với dữ liệu nhận được từ API
      setBooks(response.data.books);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm để gọi API lấy danh sách các thể loại sách
  const fetchCategories = async () => {
    try {
      // Gọi API để lấy tất cả các thể loại sách
      const response = await categoryApi.getAllCategories();
      // Nếu thành công, ta sẽ cập nhật state 'categories' với dữ liệu nhận được từ API
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Hàm xử lý khi người dùng submit form tạo mới hoặc cập nhật sách
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Tạo một đối tượng FormData để gửi dữ liệu bao gồm cả file ảnh và file ebook (nếu có)
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      // Chỉ thêm vào payload nếu giá trị không rỗng, không undefined và không null
      if (value !== undefined && value !== null && value !== '') {
        payload.append(key, value);
      }
    });

    // Nếu có file ảnh mới được chọn, ta sẽ thêm nó vào payload
    if (imageFile) {
      payload.append('image', imageFile);
    }

    if (ebookFile) {
      payload.append('ebook', ebookFile);
    }

    // Nếu đang chỉnh sửa một cuốn sách, ta sẽ gọi API cập nhật, ngược lại sẽ gọi API tạo mới
    try {
      if (editingBook) {
        // Nếu đang chỉnh sửa, ta sẽ gọi API cập nhật sách với ID của sách đang chỉnh sửa và payload chứa dữ liệu mới
        await bookApi.updateBook(editingBook._id, payload);
        setMessage('Book updated successfully');
      } else {
        // Nếu không đang chỉnh sửa, tức là đang tạo mới, ta sẽ gọi API tạo sách với payload chứa dữ liệu của sách mới
        await bookApi.createBook(payload);
        setMessage('Book created successfully');
      }
      
      //reset form sau khi tạo mới hoặc cập nhật thành công để xóa dữ liệu cũ và ẩn form
      resetForm();
      fetchBooks();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Operation failed');
    }
  };

  // Hàm xử lý khi người dùng nhấn nút "Edit" để chỉnh sửa một cuốn sách
  const handleEdit = (book) => {
    // Khi người dùng nhấn "Edit", ta sẽ cập nhật state 'editingBook' với cuốn sách được chọn để chỉnh sửa
    setEditingBook(book);
    // Đồng thời, ta sẽ điền dữ liệu của cuốn sách đó vào form để người dùng có thể chỉnh sửa
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description || '',
      category: book.category._id || book.category,
      price: book.price,
      stock: book.stock,
      imageUrl: book.imageUrl || '',
      isbn: book.isbn || '',
      publishedDate: book.publishedDate ? book.publishedDate.split('T')[0] : '',
      visibility: book.visibility,
      isEbook: book.isEbook || false
    });
    setImageFile(null);
    setEbookFile(null);
    setShowForm(true);
  };

  // Hàm xử lý khi người dùng nhấn nút "Delete" để xóa một cuốn sách
  const handleDelete = async (id) => {
    // Trước khi xóa, ta sẽ hiển thị một hộp thoại xác nhận để tránh việc xóa nhầm
    if (!window.confirm('Are you sure you want to delete this book?')) return;

    try {
      // Nếu người dùng xác nhận, ta sẽ gọi API để xóa sách với ID của sách cần xóa
      await bookApi.deleteBook(id);
      setMessage('Book deleted successfully');
      // Sau khi xóa thành công, ta sẽ gọi lại hàm fetchBooks để cập nhật lại danh sách sách hiển thị
      fetchBooks();
    } catch (error) {
      setMessage('Failed to delete book');
    }
  };

  // Hàm xử lý khi người dùng nhấn nút để thay đổi trạng thái hiển thị của sách (public/hidden)
  const toggleVisibility = async (book) => {
    try {
      // Khi người dùng nhấn nút, ta sẽ xác định trạng thái hiển thị mới bằng cách kiểm tra trạng thái hiện tại của sách
      const newVisibility = book.visibility === 'public' ? 'hidden' : 'public';
      // Sau đó, ta sẽ gọi API để cập nhật trạng thái hiển thị của sách với ID của sách và trạng thái mới
      await bookApi.updateVisibility(book._id, newVisibility);
      //gọi lại hàm fetchBooks để cập nhật lại danh sách sách hiển thị với trạng thái mới
      fetchBooks();
    } catch (error) {
      setMessage('Failed to update visibility');
    }
  };

  // Hàm để reset form về trạng thái ban đầu sau khi tạo mới hoặc cập nhật thành công, hoặc khi người dùng nhấn "Cancel"
  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      category: '',
      price: '',
      stock: '',
      imageUrl: '',
      isbn: '',
      publishedDate: '',
      visibility: 'public',
      isEbook: false
    });
    setEditingBook(null);
    setShowForm(false);
    setImageFile(null);
    setImageInputKey((prev) => prev + 1);
    setEbookFile(null);
    setEbookInputKey((prev) => prev + 1);
  };

  // Hàm để mở form quản lý preview cho một cuốn sách cụ thể
  const openPreviewForm = (book) => {
    setPreviewBook(book);
    setPreviewFiles([]);
    setPreviewInputKey((prev) => prev + 1);
    const previewCount = Array.isArray(book.previewPages) ? book.previewPages.length : 0;
    setInsertPageNumber(previewCount + 1);
    setReplacePageNumber(previewCount > 0 ? 1 : 0);
    setDeletePageNumber(previewCount > 0 ? 1 : 0);
    setInsertPreviewFile(null);
    setReplacePreviewFile(null);
    setInsertFileKey((prev) => prev + 1);
    setReplaceFileKey((prev) => prev + 1);
    setShowPreviewForm(true);
    setShowForm(false);
    setMessage('');
  };

  // Hàm để đóng form quản lý preview và reset các state liên quan
  const closePreviewForm = () => {
    setShowPreviewForm(false);
    setPreviewBook(null);
    setPreviewFiles([]);
    setPreviewInputKey((prev) => prev + 1);
    setInsertPreviewFile(null);
    setReplacePreviewFile(null);
    setInsertFileKey((prev) => prev + 1);
    setReplaceFileKey((prev) => prev + 1);
  };

  // Hàm để giải quyết URL của ảnh preview
  const resolveImageUrl = (path) => {
    // Nếu path đã là một URL đầy đủ, trả về nó. Nếu không, kết hợp với serverBaseUrl để tạo thành URL đầy đủ.
    if (!path) return '';
    // Nếu path đã bắt đầu bằng "http", ta sẽ coi đó là một URL đầy đủ và trả về nó
    return path.startsWith('http') ? path : `${serverBaseUrl}/${String(path).replace(/^\/+/, '')}`;
  };

  // Hàm để làm mới thông tin của sách đang được xem trước trong danh sách sau khi có sự thay đổi về preview
  const refreshPreviewBookInList = async (updatedBook) => {
    // Nếu updatedBook không có _id, ta sẽ gọi lại fetchBooks để làm mới toàn bộ danh sách
    if (!updatedBook?._id) {
      //  goi ham fetchBooks để đảm bảo dữ liệu hiển thị là chính xác
      await fetchBooks();
      return;
    }

    // Nếu có _id, ta sẽ cập nhật thông tin của sách đó trong state 'books' 
    // bằng cách duyệt qua danh sách sách hiện tại và thay thế sách có _id trùng khớp bằng updatedBook
    setBooks((prevBooks) => prevBooks.map((book) => (book._id === updatedBook._id ? updatedBook : book)));
    setPreviewBook(updatedBook);
    // Sau khi cập nhật thông tin sách trong danh sách, ta sẽ điều chỉnh lại các state liên quan
    //  đến quản lý preview để đảm bảo chúng phù hợp với số lượng trang preview mới của sách
    const previewCount = Array.isArray(updatedBook.previewPages) ? updatedBook.previewPages.length : 0;
    // Điều chỉnh lại số trang tối đa có thể chèn, thay thế hoặc xóa dựa trên số lượng trang preview hiện tại của sách
    setInsertPageNumber(Math.min(insertPageNumber, previewCount + 1));
    // Điều chỉnh lại số trang tối đa có thể thay thế hoặc xóa dựa trên số lượng trang preview hiện tại của sách
    setReplacePageNumber(previewCount > 0 ? Math.min(replacePageNumber || 1, previewCount) : 0);
    // Điều chỉnh lại số trang tối đa có thể xóa dựa trên số lượng trang preview hiện tại của sách
    setDeletePageNumber(previewCount > 0 ? Math.min(deletePageNumber || 1, previewCount) : 0);
  };

  // Hàm xử lý khi người dùng chọn file ảnh preview mới trong form quản lý preview
  const handlePreviewFilesChange = (e) => {
    // Khi người dùng chọn file mới, ta sẽ chuyển FileList thành một mảng để dễ dàng xử lý
    const selectedFiles = Array.from(e.target.files || []);

    // Nếu số lượng file được chọn vượt quá 10, ta sẽ hiển thị một thông báo lỗi và chỉ giữ lại 10 file đầu tiên
    if (selectedFiles.length > 10) {
      setMessage('You can upload a maximum of 10 preview images');
      setPreviewFiles(selectedFiles.slice(0, 10));
      return;
    }

    // Nếu số lượng file hợp lệ, ta sẽ cập nhật state 'previewFiles' với mảng file đã chọn
    setPreviewFiles(selectedFiles);
  };

  // Hàm xử lý khi người dùng submit form quản lý preview để tải lên hoặc cập nhật các trang preview của sách
  const handlePreviewSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // kiểm tra xem đã có sách nào được chọn để quản lý preview hay chưa
    if (!previewBook?._id) {
      setMessage('Please select a book for preview upload');
      return;
    }

    // Kiểm tra xem người dùng đã chọn ít nhất một file ảnh preview nào để tải lên hay chưa
    if (previewFiles.length === 0) {
      setMessage('Please upload at least one preview image');
      return;
    }

    // Kiểm tra xem số lượng file ảnh preview được chọn có vượt quá giới hạn tối đa là 10 hay không
    if (previewFiles.length > 10) {
      setMessage('You can upload a maximum of 10 preview images');
      return;
    }

    // Tạo một đối tượng FormData để gửi dữ liệu các file ảnh preview mới được chọn
    const payload = new FormData();
    // Thêm từng file ảnh preview vào payload với tên trường 'previewPages' để gửi lên API
    previewFiles.forEach((file) => payload.append('previewPages', file));
    // Kiểm tra xem sách đã có trang preview nào trước đó hay chưa để quyết định gọi API cập nhật hay tải lên mới
    const hasExistingPreview = Array.isArray(previewBook?.previewPages) && previewBook.previewPages.length > 0;

    try {
      //gọi API cập nhật trang preview với ID của sách và payload chứa các file ảnh mới
      if (hasExistingPreview) {
        //gọi API cập nhật trang preview để thay thế toàn bộ các trang preview cũ bằng các trang mới được chọn
        await bookApi.updateBookPreview(previewBook._id, payload);
        setMessage('Preview pages updated successfully');
      } else {
        //gọi API tải lên trang preview mới cho sách nếu trước đó chưa có trang preview nào
        await bookApi.uploadBookPreview(previewBook._id, payload);
        setMessage('Preview pages uploaded successfully');
      }
      closePreviewForm();
      // gọi lại hàm fetchBooks để làm mới lại danh sách sách hiển thị với thông tin preview mới nhất
      fetchBooks();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to upload preview pages');
    }
  };

  // Hàm xử lý "Insert" để chèn một trang preview mới vào một vị trí cụ thể trong danh sách trang preview của sách
  const handleInsertPreviewPage = async (e) => {
    e.preventDefault();
    setMessage('');

    // Lấy danh sách các trang preview hiện tại của sách đang được quản lý preview
    const currentPages = Array.isArray(previewBook?.previewPages) ? previewBook.previewPages : [];

    // Kiểm tra xem đã có sách nào được chọn để quản lý preview hay chưa
    if (!previewBook?._id) {
      setMessage('Please select a book first');
      return;
    }

    // Kiểm tra xem người dùng đã chọn file ảnh preview nào để chèn vào chưa
    if (!insertPreviewFile) {
      setMessage('Please choose an image to insert');
      return;
    }

    // Kiểm tra xem số trang preview hiện tại đã đạt giới hạn tối đa là 10 trang chưa, 
    // nếu đã đạt thì không cho phép chèn thêm
    if (currentPages.length >= 10) {
      setMessage('Cannot insert. Maximum preview pages is 10');
      return;
    }

    //formData để gửi yêu cầu chèn trang preview mới vào vị trí cụ thể trong danh sách trang preview của sách
    const payload = new FormData();
    payload.append('operation', 'insert');
    payload.append('pageNumber', String(insertPageNumber));
    payload.append('previewPage', insertPreviewFile);

    try {
      // Gọi API để chèn trang preview mới vào sách với ID của sách và payload chứa thông tin trang preview mới và vị trí chèn
      const response = await bookApi.manageBookPreviewPage(previewBook._id, payload);
      //hiển thị thông báo chèn trang preview thành công
      setMessage('Preview page inserted successfully');
      //reset lại file input
      setInsertPreviewFile(null);
      setInsertFileKey((prev) => prev + 1); // làm mới lại trang preview của sách 
      // gọi hàm refreshPreviewBookInList để cập nhật lại thông tin sách 
      // trong danh sách với thông tin trang preview mới nhất sau khi chèn thành công
      await refreshPreviewBookInList(response.data.book);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to insert preview page');
    }
  };

  // Hàm xử lý "Replace" để thay thế một trang preview cụ thể bằng một trang mới được chọn
  const handleReplacePreviewPage = async (e) => {
    e.preventDefault();
    setMessage('');

    // Lấy danh sách các trang preview hiện tại của sách đang được quản lý preview
    if (!previewBook?._id) {
      setMessage('Please select a book first');
      return;
    }

    // Kiểm tra xem người dùng đã chọn file ảnh preview nào để thay thế chưa
    if (!replacePreviewFile) {
      setMessage('Please choose an image to replace');
      return;
    }

    // Kiểm tra xem số trang preview hiện tại của sách có đủ để thay thế trang tại vị trí được chọn hay không
    if (!replacePageNumber || replacePageNumber < 1) {
      setMessage('Please choose a valid page number to replace');
      return;
    }

    // Tạo một đối tượng FormData để gửi dữ liệu yêu cầu thay thế trang preview tại vị trí 
    // cụ thể trong danh sách trang preview của sách
    const payload = new FormData();
    payload.append('operation', 'replace');
    payload.append('pageNumber', String(replacePageNumber));
    payload.append('previewPage', replacePreviewFile);

    try {
      // Gọi API để thay thế trang preview tại vị trí cụ thể trong sách với ID của sách và payload 
      // chứa thông tin trang preview mới và vị trí thay thế
      const response = await bookApi.manageBookPreviewPage(previewBook._id, payload);
      setMessage('Preview page replaced successfully');
      setReplacePreviewFile(null);
      setReplaceFileKey((prev) => prev + 1);
      // gọi hàm refreshPreviewBookInList để cập nhật lại thông tin sách trong danh sách 
      // với thông tin trang preview mới nhất sau khi thay thế thành công
      await refreshPreviewBookInList(response.data.book);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to replace preview page');
    }
  };

  // Hàm xử lý "Delete" để xóa một trang preview cụ thể khỏi danh sách trang preview của sách
  const handleDeletePreviewPage = async () => {
    setMessage('');

    // Kiểm tra xem đã có sách nào được chọn để quản lý preview hay chưa
    if (!previewBook?._id) {
      setMessage('Please select a book first');
      return;
    }

    // Kiểm tra xem số trang preview hiện tại của sách có đủ để xóa trang tại vị trí được chọn hay không
    if (!deletePageNumber || deletePageNumber < 1) {
      setMessage('Please choose a valid page number to delete');
      return;
    }

    // Tạo một đối tượng FormData để gửi dữ liệu yêu cầu xóa trang preview tại 
    // vị trí cụ thể trong danh sách trang preview của sách
    const payload = new FormData();
    payload.append('operation', 'delete');
    payload.append('pageNumber', String(deletePageNumber));

    try {
      // Gọi API để xóa trang preview tại vị trí cụ thể trong sách với ID
      const response = await bookApi.manageBookPreviewPage(previewBook._id, payload);
      setMessage('Preview page deleted successfully');
        // gọi hàm refreshPreviewBookInList để cập nhật lại thông tin sách trong danh sách
      await refreshPreviewBookInList(response.data.book);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to delete preview page');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Books Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          {showForm ? 'Cancel' : '+ Add New Book'}
        </button>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3>{editingBook ? 'Edit Book' : 'Add New Book'}</h3>
          
          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="Title *"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Author *"
              value={formData.author}
              onChange={(e) => setFormData({...formData, author: e.target.value})}
              required
              style={styles.input}
            />
          </div>

          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={styles.textarea}
            rows="4"
          />

          <div style={styles.formRow}>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
              style={styles.input}
            >
              <option value="">Select Category *</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={formData.visibility}
              onChange={(e) => setFormData({...formData, visibility: e.target.value})}
              style={styles.input}
            >
              <option value="public">Public</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div style={styles.formRow}>
            <input
              type="number"
              placeholder="Price (VND) *"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
              min="0"
              step="1000"
              style={styles.input}
            />
            <input
              type="number"
              placeholder="Stock *"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
              required
              min="0"
              style={styles.input}
            />
          </div>

          <div style={styles.fileUploadRow}>
            <label style={styles.fileLabel}>Book Cover Image</label>
            <input
              key={imageInputKey}
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              style={styles.input}
            />
          </div>

          <div style={styles.ebookRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isEbook}
                onChange={(e) => setFormData({ ...formData, isEbook: e.target.checked })}
                style={{ marginRight: '0.5rem' }}
              />
              📱 This is an E-Book
            </label>
          </div>

          {formData.isEbook && (
            <div style={styles.ebookUploadRow}>
              <label style={styles.ebookLabel}>E-Book PDF File{!editingBook ? ' *' : ' (leave blank to keep existing)'}:</label>
              <input
                key={ebookInputKey}
                type="file"
                accept="application/pdf"
                onChange={(e) => setEbookFile(e.target.files?.[0] || null)}
                style={styles.input}
                required={!editingBook && formData.isEbook && !ebookFile}
              />
            </div>
          )}

          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="ISBN"
              value={formData.isbn}
              onChange={(e) => setFormData({...formData, isbn: e.target.value})}
              style={styles.input}
            />
            <input
              type="date"
              placeholder="Published Date"
              value={formData.publishedDate}
              onChange={(e) => setFormData({...formData, publishedDate: e.target.value})}
              style={styles.input}
            />
          </div>

          <div style={styles.formActions}>
            <button type="submit" style={styles.submitButton}>
              {editingBook ? 'Update Book' : 'Create Book'}
            </button>
            <button type="button" onClick={resetForm} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {showPreviewForm && (
        <form onSubmit={handlePreviewSubmit} style={styles.form}>
          <h3>
            {Array.isArray(previewBook?.previewPages) && previewBook.previewPages.length > 0
              ? 'Update Preview Book'
              : 'Add Preview Book'}
          </h3>
          <p style={styles.previewMeta}>
            Selected book: <strong>{previewBook?.title}</strong>
          </p>
          <p style={styles.previewHint}>
            Upload up to 10 images. The selection order is the page order (first image = page 1).
          </p>

          <div style={styles.previewCurrentPages}>
            <h4 style={styles.previewSectionTitle}>Current Preview Pages ({Array.isArray(previewBook?.previewPages) ? previewBook.previewPages.length : 0}/10)</h4>
            {!Array.isArray(previewBook?.previewPages) || previewBook.previewPages.length === 0 ? (
              <div style={styles.previewEmpty}>No preview pages yet.</div>
            ) : (
              <div style={styles.previewGrid}>
                {previewBook.previewPages.map((pagePath, index) => (
                  <div key={`${pagePath}-${index}`} style={styles.previewCard}>
                    <img src={resolveImageUrl(pagePath)} alt={`Preview page ${index + 1}`} style={styles.previewThumb} />
                    <div style={styles.previewCardLabel}>Page {index + 1}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <input
            key={previewInputKey}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePreviewFilesChange}
            style={styles.input}
          />

          {previewFiles.length > 0 && (
            <div style={styles.previewList}>
              {previewFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} style={styles.previewListItem}>
                  Page {index + 1}: {file.name}
                </div>
              ))}
            </div>
          )}

          <div style={styles.formActions}>
            <button type="submit" style={styles.submitButton}>
              {Array.isArray(previewBook?.previewPages) && previewBook.previewPages.length > 0
                ? 'Replace All Preview Pages'
                : 'Save Preview Pages'}
            </button>
            <button type="button" onClick={closePreviewForm} style={styles.cancelButton}>
              Cancel
            </button>
          </div>

          <div style={styles.previewManageSection}>
            <h4 style={styles.previewSectionTitle}>Insert New Preview Page</h4>
            <div style={styles.previewActionRow}>
              <input
                key={insertFileKey}
                type="file"
                accept="image/*"
                onChange={(e) => setInsertPreviewFile(e.target.files?.[0] || null)}
                style={styles.input}
              />
              <input
                type="number"
                min="1"
                max={(Array.isArray(previewBook?.previewPages) ? previewBook.previewPages.length : 0) + 1}
                value={insertPageNumber}
                onChange={(e) => setInsertPageNumber(Number(e.target.value) || 1)}
                style={styles.input}
              />
              <button type="button" onClick={handleInsertPreviewPage} style={styles.previewActionButton}>Insert</button>
            </div>
          </div>

          <div style={styles.previewManageSection}>
            <h4 style={styles.previewSectionTitle}>Replace Preview Page</h4>
            <div style={styles.previewActionRow}>
              <input
                key={replaceFileKey}
                type="file"
                accept="image/*"
                onChange={(e) => setReplacePreviewFile(e.target.files?.[0] || null)}
                style={styles.input}
              />
              <input
                type="number"
                min="1"
                max={Math.max(Array.isArray(previewBook?.previewPages) ? previewBook.previewPages.length : 0, 1)}
                value={replacePageNumber || ''}
                onChange={(e) => setReplacePageNumber(Number(e.target.value) || 1)}
                style={styles.input}
                disabled={!Array.isArray(previewBook?.previewPages) || previewBook.previewPages.length === 0}
              />
              <button
                type="button"
                onClick={handleReplacePreviewPage}
                style={styles.previewActionButton}
                disabled={!Array.isArray(previewBook?.previewPages) || previewBook.previewPages.length === 0}
              >
                Replace
              </button>
            </div>
          </div>

          <div style={styles.previewManageSection}>
            <h4 style={styles.previewSectionTitle}>Delete Preview Page</h4>
            <div style={styles.previewActionRow}>
              <input
                type="number"
                min="1"
                max={Math.max(Array.isArray(previewBook?.previewPages) ? previewBook.previewPages.length : 0, 1)}
                value={deletePageNumber || ''}
                onChange={(e) => setDeletePageNumber(Number(e.target.value) || 1)}
                style={styles.input}
                disabled={!Array.isArray(previewBook?.previewPages) || previewBook.previewPages.length === 0}
              />
              <button
                type="button"
                onClick={handleDeletePreviewPage}
                style={styles.previewDeleteButton}
                disabled={!Array.isArray(previewBook?.previewPages) || previewBook.previewPages.length === 0}
              >
                Delete Page
              </button>
            </div>
          </div>
        </form>
      )}

      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <div style={styles.th}>Title</div>
          <div style={styles.th}>Author</div>
          <div style={styles.th}>Category</div>
          <div style={{ ...styles.th, ...styles.formatTh }}>Format</div>
          <div style={styles.th}>Price</div>
          <div style={styles.th}>Stock</div>
          <div style={styles.th}>Visibility</div>
          <div style={styles.th}>Actions</div>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : books.length === 0 ? (
          <div style={styles.empty}>No books found</div>
        ) : (
          books.map(book => (
            <div key={book._id} style={styles.tableRow}>
              <div style={styles.td}>
                {book.title}
              </div>
              <div style={styles.td}>{book.author}</div>
              <div style={styles.td}>{book.category?.name || 'N/A'}</div>
              <div style={{ ...styles.td, ...styles.formatTd }}>
                {book.isEbook ? (
                  <span style={styles.ebookBadge}>📱 E-Book</span>
                ) : (
                  <span style={styles.physicalBadge}>📘 Physical</span>
                )}
              </div>
              <div style={styles.td}>{book.price.toLocaleString('vi-VN')}₫</div>
              <div style={styles.td}>{book.stock}</div>
              <div style={styles.td}>
                <button
                  onClick={() => toggleVisibility(book)}
                  style={book.visibility === 'public' ? styles.publicBadge : styles.hiddenBadge}
                >
                  {book.visibility}
                </button>
              </div>
              <div style={styles.td}>
                <button onClick={() => handleEdit(book)} style={styles.editBtn}>
                  Edit
                </button>
                <button onClick={() => openPreviewForm(book)} style={styles.previewBtn}>
                  {Array.isArray(book.previewPages) && book.previewPages.length > 0
                    ? 'Update Preview Book'
                    : 'Add Preview Book'}
                </button>
                <button onClick={() => handleDelete(book._id)} style={styles.deleteBtn}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { fontSize: '2rem', color: '#2c3e50' },
  addButton: { backgroundColor: '#27ae60', color: '#fff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
  message: { backgroundColor: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' },
  form: { backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
  input: { padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', width: '100%' },
  textarea: { padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', width: '100%', marginBottom: '1rem' },
  formActions: { display: 'flex', gap: '1rem', marginTop: '1rem' },
  previewMeta: { marginBottom: '0.5rem', color: '#2c3e50' },
  previewHint: { marginBottom: '1rem', color: '#7f8c8d', fontSize: '0.9rem' },
  previewCurrentPages: { marginBottom: '1rem', border: '1px solid #ecf0f1', borderRadius: '6px', padding: '0.75rem', backgroundColor: '#f8f9fa' },
  previewSectionTitle: { margin: '0 0 0.75rem 0', color: '#2c3e50' },
  previewEmpty: { color: '#7f8c8d', fontSize: '0.9rem' },
  previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' },
  previewCard: { border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#fff' },
  previewThumb: { width: '100%', height: '160px', objectFit: 'cover' },
  previewCardLabel: { padding: '0.45rem', textAlign: 'center', fontSize: '0.85rem', color: '#2c3e50', fontWeight: 600 },
  previewList: { marginTop: '1rem', marginBottom: '1rem', backgroundColor: '#f8f9fa', border: '1px solid #ecf0f1', borderRadius: '4px', padding: '0.75rem' },
  previewListItem: { fontSize: '0.9rem', color: '#2c3e50', marginBottom: '0.35rem' },
  previewManageSection: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ecf0f1' },
  previewActionRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr', gap: '0.75rem', alignItems: 'center' },
  previewActionButton: { backgroundColor: '#2d8cf0', color: '#fff', padding: '0.6rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  previewDeleteButton: { backgroundColor: '#e74c3c', color: '#fff', padding: '0.6rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  submitButton: { backgroundColor: '#3498db', color: '#fff', padding: '0.75rem 2rem', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  cancelButton: { backgroundColor: '#95a5a6', color: '#fff', padding: '0.75rem 2rem', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  table: { backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  tableHeader: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr 0.8fr 1fr 1.5fr', backgroundColor: '#34495e', color: '#fff', padding: '1rem' },
  th: { fontWeight: 'bold', fontSize: '0.9rem' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr 0.8fr 1fr 1.5fr', padding: '1rem', borderBottom: '1px solid #ecf0f1' },
  td: { fontSize: '0.9rem', display: 'flex', alignItems: 'center' },
  formatTh: { textAlign: 'left' },
  formatTd: { justifyContent: 'flex-start' },
  publicBadge: { backgroundColor: '#27ae60', color: '#fff', padding: '0.25rem 0.75rem', border: 'none', borderRadius: '12px', fontSize: '0.8rem', cursor: 'pointer' },
  hiddenBadge: { backgroundColor: '#e74c3c', color: '#fff', padding: '0.25rem 0.75rem', border: 'none', borderRadius: '12px', fontSize: '0.8rem', cursor: 'pointer' },
  editBtn: { backgroundColor: '#3498db', color: '#fff', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.85rem' },
  previewBtn: { backgroundColor: '#f39c12', color: '#fff', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.85rem' },
  deleteBtn: { backgroundColor: '#e74c3c', color: '#fff', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  loading: { textAlign: 'center', padding: '2rem', color: '#7f8c8d' },
  empty: { textAlign: 'center', padding: '2rem', color: '#7f8c8d' },
  ebookRow: { marginBottom: '1rem' },
  ebookUploadRow: { marginBottom: '1rem' },
  checkboxLabel: { display: 'flex', alignItems: 'center', fontSize: '1rem', cursor: 'pointer', color: '#2c3e50' },
  ebookLabel: { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#555' },
  ebookBadge: { backgroundColor: '#8b5cf6', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600', minWidth: '92px', textAlign: 'center', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' },
  physicalBadge: { backgroundColor: '#64748b', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600', minWidth: '92px', textAlign: 'center', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' },
  fileUploadRow: { marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  fileLabel: { fontSize: '0.85rem', fontWeight: '600', color: '#2c3e50', textTransform: 'uppercase', letterSpacing: '0.3px' },
  fileHint: { fontSize: '0.8rem', color: '#7f8c8d', fontStyle: 'italic' }
};

export default BooksManagement;