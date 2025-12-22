import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getProducts, createProduct, updateProduct } from '../../services/api';
import { FaArrowLeft, FaImage, FaTimes } from 'react-icons/fa';
import './AdminProductForm.css';

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: {
      original: '',
      current: '',
      discount: 0
    },
    category: '',
    brand: '',
    specifications: {},
    features: [''],
    stock: {
      quantity: 0,
      available: true
    },
    rating: {
      average: 4.8,
      count: 0
    },
    seller: {
      name: 'Mercado Livre',
      official: true,
      sales: 1000000
    },
    shipping: {
      free: true,
      fast: true
    },
    active: true
  });

  useEffect(() => {
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  useEffect(() => {
    // Calcular desconto automaticamente
    if (formData.price.original && formData.price.current) {
      const discount = Math.round(
        ((formData.price.original - formData.price.current) / formData.price.original) * 100
      );
      setFormData(prev => ({
        ...prev,
        price: { ...prev.price, discount: discount > 0 ? discount : 0 }
      }));
    }
  }, [formData.price.original, formData.price.current]);

  const loadProduct = async () => {
    try {
      const response = await getProducts({});
      const product = response.data.find(p => p._id === id);
      if (product) {
        setFormData({
          ...product,
          features: product.features.length > 0 ? product.features : ['']
        });
        setImagePreviews(product.images.map(img => `http://localhost:5000${img}`));
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages([...images, ...files]);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const handleSpecChange = (key, value) => {
    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications,
        [key]: value
      }
    });
  };

  const addSpecification = () => {
    const key = prompt('Nome da especificação:');
    if (key) {
      handleSpecChange(key, '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      
      // Adicionar imagens
      images.forEach(image => {
        data.append('images', image);
      });

      // Preparar dados do produto
      const productData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== ''),
        price: {
          original: parseFloat(formData.price.original),
          current: parseFloat(formData.price.current),
          discount: formData.price.discount
        },
        stock: {
          quantity: parseInt(formData.stock.quantity),
          available: formData.stock.available
        }
      };

      // Adicionar dados como JSON
      data.append('data', JSON.stringify(productData));

      if (isEdit) {
        await updateProduct(id, data);
      } else {
        await createProduct(data);
      }

      navigate('/admin/produtos');
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-product-form">
      <div className="form-header">
        <Link to="/admin/produtos" className="btn-back">
          <FaArrowLeft /> Voltar
        </Link>
        <h1>{isEdit ? 'Editar Produto' : 'Novo Produto'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        {/* Imagens */}
        <div className="form-section">
          <h2>Imagens do Produto</h2>
          <div className="image-upload-area">
            <input
              type="file"
              id="images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="images" className="upload-label">
              <FaImage size={40} />
              <p>Clique para adicionar imagens</p>
              <span>JPG, PNG ou WEBP (max 5MB)</span>
            </label>
          </div>

          {imagePreviews.length > 0 && (
            <div className="image-preview-grid">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="btn-remove-image"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações Básicas */}
        <div className="form-section">
          <h2>Informações Básicas</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Título do Produto *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Ex: Fogão 4 Bocas Atlas Mônaco Top Glass..."
              />
            </div>

            <div className="form-group">
              <label>Marca *</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
                placeholder="Ex: Atlas"
              />
            </div>

            <div className="form-group">
              <label>Categoria *</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                placeholder="Ex: Casa, Móveis e Decoração"
              />
            </div>

            <div className="form-group full-width">
              <label>Descrição *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows="4"
                placeholder="Descreva o produto..."
              />
            </div>
          </div>
        </div>

        {/* Preço */}
        <div className="form-section">
          <h2>Preço</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Preço Original (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price.original}
                onChange={(e) => setFormData({
                  ...formData,
                  price: { ...formData.price, original: e.target.value }
                })}
                required
                placeholder="1021.90"
              />
            </div>

            <div className="form-group">
              <label>Preço Atual (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price.current}
                onChange={(e) => setFormData({
                  ...formData,
                  price: { ...formData.price, current: e.target.value }
                })}
                required
                placeholder="199.90"
              />
            </div>

            <div className="form-group">
              <label>Desconto (%)</label>
              <input
                type="number"
                value={formData.price.discount}
                readOnly
                className="readonly-input"
              />
            </div>
          </div>
        </div>

        {/* Estoque */}
        <div className="form-section">
          <h2>Estoque</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Quantidade em Estoque *</label>
              <input
                type="number"
                value={formData.stock.quantity}
                onChange={(e) => setFormData({
                  ...formData,
                  stock: { ...formData.stock, quantity: e.target.value }
                })}
                required
                min="0"
                placeholder="41"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.stock.available}
                  onChange={(e) => setFormData({
                    ...formData,
                    stock: { ...formData.stock, available: e.target.checked }
                  })}
                />
                <span>Disponível para venda</span>
              </label>
            </div>
          </div>
        </div>

        {/* Características */}
        <div className="form-section">
          <h2>Características do Produto</h2>
          <div className="features-list">
            {formData.features.map((feature, index) => (
              <div key={index} className="feature-item">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  placeholder="Ex: Tipo de porta do forno: Com visor"
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="btn-remove-feature"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addFeature} className="btn-add-feature">
            + Adicionar Característica
          </button>
        </div>

        {/* Especificações */}
        <div className="form-section">
          <h2>Especificações Técnicas</h2>
          <div className="specifications-list">
            {Object.entries(formData.specifications).map(([key, value]) => (
              <div key={key} className="spec-item">
                <label>{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleSpecChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={addSpecification} className="btn-add-feature">
            + Adicionar Especificação
          </button>
        </div>

        {/* Envio e Status */}
        <div className="form-section">
          <h2>Envio e Status</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.shipping.free}
                  onChange={(e) => setFormData({
                    ...formData,
                    shipping: { ...formData.shipping, free: e.target.checked }
                  })}
                />
                <span>Frete grátis</span>
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.shipping.fast}
                  onChange={(e) => setFormData({
                    ...formData,
                    shipping: { ...formData.shipping, fast: e.target.checked }
                  })}
                />
                <span>Envio rápido (FULL)</span>
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <span>Produto ativo</span>
              </label>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="form-actions">
          <Link to="/admin/produtos" className="btn-cancel-form">
            Cancelar
          </Link>
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? 'Salvando...' : (isEdit ? 'Atualizar Produto' : 'Criar Produto')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
