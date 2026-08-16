'use client'

import React, { useState } from 'react'
import { Heart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Product } from '@/lib/types/product'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)

  const renderStars = () => {
    const stars = []
    const fullStars = Math.max(0, Math.min(5, Math.floor(product.rating)))

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${i < fullStars ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 fill-gray-300'}`}
        />
      )
    }
    return stars
  }

  return (
    <Card className="bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-gray-100 group">
      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          aria-label="Add to wishlist"
        >
          <Heart
            className={`w-6 h-6 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
          />
        </button>
        <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <CardContent className="p-6">
        <h3 className="font-display text-xl font-bold text-gray-900 mb-2 hover:text-accent transition-colors cursor-pointer">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{product.description}</p>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex">{renderStars()}</div>
          <span className="text-sm font-semibold text-gray-700">
            {product.rating} ({product.reviewCount})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-display text-3xl font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          <Button
            disabled={!product.inStock}
            className="bg-gradient-to-r from-accent to-accent-dark hover:opacity-90 shadow-lg hover:scale-110 transition-all"
          >
            {product.inStock ? 'Add to Cart' : 'Out of stock'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
