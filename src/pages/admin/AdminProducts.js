import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct } from '../../services/api';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBox } from 'react-icons/fa';
import './AdminProducts.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts({});
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p._id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      alert('Erro ao deletar produto');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="products-header">
        <div className="header-info">
          <h1>Produtos</h1>
          <p>{products.length} produto(s) cadastrado(s)</p>
        </div>
        <Link to="/admin/produtos/novo" className="btn-add-product">
          <FaPlus /> Novo Produto
        </Link>
      </div>

      <div className="products-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="no-products">
          <FaBox size={60} color="#ccc" />
          <h2>Nenhum produto encontrado</h2>
          <p>Crie seu primeiro produto para começar</p>
          <Link to="/admin/produtos/novo" className="btn-add-product">
            <FaPlus /> Criar Produto
          </Link>
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="product-image-cell">
                      <img src={`http://localhost:5000${product.images[0]}`} alt={product.title} />
                    </div>
                  </td>
                  <td>
                    <div className="product-info-cell">
                      <strong>{product.title}</strong>
                      <span className="product-brand">{product.brand}</span>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>
                    <div className="price-cell">
                      <strong>{formatPrice(product.price.current)}</strong>
                      {product.price.discount > 0 && (
                        <span className="discount-tag">{product.price.discount}% OFF</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`stock-badge ${product.stock.available ? 'in-stock' : 'out-stock'}`}>
                      {product.stock.quantity} un.
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${product.active ? 'active' : 'inactive'}`}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/admin/produtos/editar/${product._id}`} className="btn-edit" title="Editar">
                        <FaEdit />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(product._id)}
                        className="btn-delete"
                        title="Deletar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Confirmação */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja deletar este produto?</p>
            <div className="modal-actions">
              <button onClick={() => setDeleteConfirm(null)} className="btn-cancel">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-confirm-delete">
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
