import { useState, useEffect } from 'react'
import { getProductFocus, setProductFocus } from '../../services/db'
import { useToast } from '../../contexts/ToastContext'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Plus, Star, Trash2, X, Package } from 'lucide-react'

export default function ProductFocusWidget() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newProduct, setNewProduct] = useState('')
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const data = await getProductFocus()
      setProducts(data)
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddProduct(e) {
    e.preventDefault()
    if (!newProduct.trim()) {
      showError('Nama produk tidak boleh kosong')
      return
    }

    try {
      const updated = [...products, newProduct.trim()]
      await setProductFocus(updated)
      setProducts(updated)
      setNewProduct('')
      setShowForm(false)
      success('Produk focus ditambahkan')
    } catch (err) {
      showError('Gagal menyimpan produk')
    }
  }

  async function handleRemoveProduct(index) {
    try {
      const updated = products.filter((_, i) => i !== index)
      await setProductFocus(updated)
      setProducts(updated)
      success('Produk dihapus dari focus')
    } catch (err) {
      showError('Gagal menghapus produk')
    }
  }

  async function handleMoveUp(index) {
    if (index === 0) return
    const updated = [...products]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    await setProductFocus(updated)
    setProducts(updated)
  }

  async function handleMoveDown(index) {
    if (index === products.length - 1) return
    const updated = [...products]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    await setProductFocus(updated)
    setProducts(updated)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Produk Focus
          </h3>
          {products.length > 0 && (
            <span className="badge-info">{products.length}</span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleAddProduct} className="mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nama produk..."
              value={newProduct}
              onChange={e => setNewProduct(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Product List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-10 rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-4">
          <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum ada produk focus
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowForm(true)}
            className="mt-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-primary-50 dark:bg-primary-900/10 rounded-lg group"
            >
              <span className="w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                {index + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                {product}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-primary disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === products.length - 1}
                  className="p-1 text-gray-400 hover:text-primary disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleRemoveProduct(index)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}