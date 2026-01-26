import { useState, useEffect } from 'react';
import { categoryApi } from '../../api/categoryApi';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAllCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory._id, formData);
        setMessage('Category updated successfully');
      } else {
        await categoryApi.createCategory(formData);
        setMessage('Category created successfully');
      }
      
      resetForm();
      fetchCategories();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryApi.deleteCategory(id);
      setMessage('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingCategory(null);
    setShowForm(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Categories Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          {showForm ? 'Cancel' : '+ Add New Category'}
        </button>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
          
          <input
            type="text"
            placeholder="Category Name *"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            style={styles.input}
          />

          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={styles.textarea}
            rows="4"
          />

          <div style={styles.formActions}>
            <button type="submit" style={styles.submitButton}>
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
            <button type="button" onClick={resetForm} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={styles.grid}>
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : categories.length === 0 ? (
          <div style={styles.empty}>No categories found</div>
        ) : (
          categories.map(category => (
            <div key={category._id} style={styles.card}>
              <h3 style={styles.categoryName}>{category.name}</h3>
              <p style={styles.categoryDesc}>
                {category.description || 'No description'}
              </p>
              <div style={styles.categoryDate}>
                Created: {new Date(category.createdAt).toLocaleDateString()}
              </div>
              <div style={styles.cardActions}>
                <button
                  onClick={() => handleEdit(category)}
                  style={styles.editBtn}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category._id)}
                  style={styles.deleteBtn}
                >
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
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2rem',
    color: '#2c3e50'
  },
  addButton: {
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  message: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  form: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    width: '100%',
    marginBottom: '1rem'
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    width: '100%',
    marginBottom: '1rem'
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem'
  },
  submitButton: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.75rem 2rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    color: '#fff',
    padding: '0.75rem 2rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  categoryName: {
    fontSize: '1.3rem',
    color: '#2c3e50',
    marginBottom: '0.5rem'
  },
  categoryDesc: {
    color: '#7f8c8d',
    lineHeight: '1.5',
    marginBottom: '1rem',
    minHeight: '3rem'
  },
  categoryDate: {
    fontSize: '0.85rem',
    color: '#95a5a6',
    marginBottom: '1rem'
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '0.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '0.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    gridColumn: '1 / -1',
    color: '#7f8c8d'
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    gridColumn: '1 / -1',
    color: '#7f8c8d'
  }
};

export default CategoriesManagement;