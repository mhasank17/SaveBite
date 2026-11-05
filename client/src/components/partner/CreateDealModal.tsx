import React, { useState, useRef, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import partnerApi, { CreateListingData } from '../../services/partnerApi';
import { handleImageError } from '../../utils/foodImages';

export interface DealItemForEdit {
  id: string;
  title: string;
  description: string;
  categoryId?: string;
  category?: { name: string; id?: string };
  imageUrl?: string;
  originalPriceInr: number;
  surplusPriceInr: number;
  totalQuantity: number;
  availableQuantity?: number;
  pickupStartTime?: string;
  pickupEndTime?: string;
  dietaryTags?: string[];
  isMysteryBox?: boolean;
}

export interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deal: any) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  dealToEdit?: DealItemForEdit | null;
}

// Exactly 3 categories assignable to deals (All is a customer-side filter only)
export const DEAL_CATEGORIES = [
  { id: 'demo-cat-meal', name: 'Meal', icon: 'dinner_dining', slug: 'meal' },
  { id: 'demo-cat-bakery', name: 'Bakery', icon: 'bakery_dining', slug: 'bakery' },
  { id: 'demo-cat-pantry', name: 'Pantry', icon: 'inventory_2', slug: 'pantry' },
];

// Curated, high-quality Unsplash food photographs for each category
export const CATEGORY_PRESET_IMAGES: Record<string, string[]> = {
  meal: [
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', // Fragrant Dum Biryani Rice
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', // Chef Dinner Bowl with Veggies
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', // Gourmet Brioche Burger & Wedges
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', // Artisan Neapolitan Pizza
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', // Fresh Sushi & Maki Bento
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', // Toasted Artisan Club Sandwich
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', // Curated Mystery Meal Rescue Box
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80', // Indian Curry & Rice Thali
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', // Wok Noodles / Ramen
  ],
  bakery: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', // Artisanal Sourdough & Country Loaves
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', // Gourmet Chocolate Cake & Patisserie
    'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80', // Hearth Baguettes & Brioche
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', // Golden Butter Croissants
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80', // Artisan Glazed Doughnuts & Desserts
    'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=800&q=80', // Glazed Cinnamon Buns & Pastries
    'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80', // Strawberry Cheesecake Tart
  ],
  pantry: [
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', // Oats, Grains & Pantry Staples
    'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80', // Roasted Almonds, Nuts & Packaged Snacks
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80', // Honey Jars, Preserves & Provisions
    'https://images.unsplash.com/photo-1517093157656-b9ec81640a23?auto=format&fit=crop&w=800&q=80', // Crispy Granola & Muesli
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80', // Fresh Groceries & Packaged Provisions
  ],
};

export const CreateDealModal: React.FC<CreateDealModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
  dealToEdit = null,
}) => {
  const isEditing = Boolean(dealToEdit);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(DEAL_CATEGORIES[0].id);
  const [originalPriceInr, setOriginalPriceInr] = useState<number>(450);
  const [surplusPriceInr, setSurplusPriceInr] = useState<number>(129);
  const [totalQuantity, setTotalQuantity] = useState<number>(5);
  const [pickupStartTime, setPickupStartTime] = useState('18:00');
  const [pickupEndTime, setPickupEndTime] = useState('21:30');
  const [isMysteryBox, setIsMysteryBox] = useState(true);
  const [imageUrl, setImageUrl] = useState(CATEGORY_PRESET_IMAGES.meal[0]);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [dietaryTag, setDietaryTag] = useState('Vegetarian Friendly');
  const [loading, setLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine current active category slug
  const currentCategorySlug = DEAL_CATEGORIES.find((c) => c.id === categoryId)?.slug || 'meal';
  const activePresets = CATEGORY_PRESET_IMAGES[currentCategorySlug] || CATEGORY_PRESET_IMAGES.meal;

  // Initialize form state when opening (new or edit)
  useEffect(() => {
    if (!isOpen) return;

    if (dealToEdit) {
      setTitle(dealToEdit.title || '');
      setDescription(dealToEdit.description || '');

      // Resolve category
      let matchedCatId = DEAL_CATEGORIES[0].id;
      if (dealToEdit.categoryId) {
        const idLower = dealToEdit.categoryId.toLowerCase();
        if (idLower.includes('bakery')) matchedCatId = 'demo-cat-bakery';
        else if (idLower.includes('pantry')) matchedCatId = 'demo-cat-pantry';
        else matchedCatId = 'demo-cat-meal';
      } else if (dealToEdit.category?.name) {
        const nameLower = dealToEdit.category.name.toLowerCase();
        if (nameLower.includes('bakery')) matchedCatId = 'demo-cat-bakery';
        else if (nameLower.includes('pantry')) matchedCatId = 'demo-cat-pantry';
        else matchedCatId = 'demo-cat-meal';
      }
      setCategoryId(matchedCatId);

      setOriginalPriceInr(dealToEdit.originalPriceInr || 450);
      setSurplusPriceInr(dealToEdit.surplusPriceInr || 129);
      setTotalQuantity(dealToEdit.totalQuantity || 5);
      setPickupStartTime(dealToEdit.pickupStartTime || '18:00');
      setPickupEndTime(dealToEdit.pickupEndTime || '21:30');
      setIsMysteryBox(dealToEdit.isMysteryBox ?? true);

      if (dealToEdit.imageUrl) {
        setImageUrl(dealToEdit.imageUrl);
        // If image URL is not in standard presets, treat as custom
        const allPresets = Object.values(CATEGORY_PRESET_IMAGES).flat();
        if (!allPresets.includes(dealToEdit.imageUrl)) {
          setCustomImageUrl(dealToEdit.imageUrl);
        } else {
          setCustomImageUrl(null);
        }
      }
    } else {
      // Reset for creation
      setTitle('');
      setDescription('');
      setCategoryId('demo-cat-meal');
      setOriginalPriceInr(450);
      setSurplusPriceInr(129);
      setTotalQuantity(5);
      setPickupStartTime('18:00');
      setPickupEndTime('21:30');
      setIsMysteryBox(true);
      setImageUrl(CATEGORY_PRESET_IMAGES.meal[0]);
      setCustomImageUrl(null);
      setDietaryTag('Vegetarian Friendly');
    }
  }, [isOpen, dealToEdit]);

  // Handle category switch
  const handleCategorySelect = (catId: string) => {
    setCategoryId(catId);
    const cat = DEAL_CATEGORIES.find((c) => c.id === catId);
    const slug = cat?.slug || 'meal';
    const presets = CATEGORY_PRESET_IMAGES[slug] || CATEGORY_PRESET_IMAGES.meal;

    // If user has not uploaded a custom image, switch to the category's first preset
    if (!customImageUrl) {
      setImageUrl(presets[0]);
    }
  };

  // Handle custom image file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers onChange
    e.target.value = '';

    // 1. Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      onShowToast('error', 'Please select a JPG, JPEG, PNG, or WebP image.', 'Invalid Format');
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      onShowToast('error', 'Image size must be less than 5 MB.', 'File Too Large');
      return;
    }

    // 2. Generate local instant preview
    const localPreviewUrl = URL.createObjectURL(file);
    setCustomImageUrl(localPreviewUrl);
    setImageUrl(localPreviewUrl);

    // 3. Upload to Supabase Storage / backend
    setIsUploadingImage(true);
    try {
      const uploadedUrl = await partnerApi.uploadDealImage(file);
      setCustomImageUrl(uploadedUrl);
      setImageUrl(uploadedUrl);
      onShowToast('success', 'Custom deal image uploaded to storage.', 'Image Uploaded');
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to upload image.', 'Upload Error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove uploaded custom image
  const handleRemoveCustomImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomImageUrl(null);
    setImageUrl(activePresets[0]);
    onShowToast('info', 'Custom image removed. Restored preset image.', 'Preset Restored');
  };

  // Computations
  const discountPercent =
    originalPriceInr > surplusPriceInr
      ? Math.round(((originalPriceInr - surplusPriceInr) / originalPriceInr) * 100)
      : 0;
  const savingsInr = Math.max(0, originalPriceInr - surplusPriceInr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      onShowToast('error', 'Please enter a title and description for the deal offer.', 'Missing Fields');
      return;
    }
    if (surplusPriceInr >= originalPriceInr) {
      onShowToast('error', 'Deal price must be lower than original price to provide savings.', 'Invalid Pricing');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateListingData = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        imageUrl,
        originalPriceInr,
        surplusPriceInr,
        totalQuantity,
        pickupStartTime,
        pickupEndTime,
        dietaryTags: [dietaryTag, 'Fresh Today'].filter(Boolean),
        isMysteryBox,
        co2eSavingsKg: 1.8,
      };

      if (isEditing && dealToEdit) {
        const updated = await partnerApi.updateListing(dealToEdit.id, {
          ...payload,
          availableQuantity: totalQuantity,
        });
        onSuccess(updated);
        onShowToast('success', `"${title}" updated successfully!`, 'Deal Updated ✏️');
      } else {
        const newListing = await partnerApi.createListing(payload);
        onSuccess(newListing);
        onShowToast('success', `"${newListing.title}" published with ${totalQuantity} portions!`, 'Deal Published 🎉');
      }
      onClose();
    } catch (err: any) {
      onShowToast('error', err.message || (isEditing ? 'Failed to update deal.' : 'Failed to publish deal listing.'), 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Food Deal / Mystery Box' : 'Create Food Deal / Mystery Box'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1 max-h-[75vh] overflow-y-auto pr-1">
        {/* Deal Type Selector */}
        <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
          <div className="flex-1 flex flex-col">
            <span className="font-bold text-sm text-on-surface">Mystery Box / Surprise Pack</span>
            <span className="text-xs text-on-surface-variant">
              Surprise assortment of today’s freshly prepared food or surplus items
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isMysteryBox}
              onChange={(e) => setIsMysteryBox(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Category Picker (Only 3 genuine deal categories) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-label-sm font-bold text-on-surface">Category</label>
            <span className="text-[11px] text-on-surface-variant">
              Classify your food deal
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEAL_CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  categoryId === cat.id
                    ? 'border-primary bg-primary/5 text-primary font-bold shadow-xs'
                    : 'border-outline-variant/40 bg-surface text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                <span className="text-xs truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title & Description */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="deal-title" className="text-label-sm font-bold text-on-surface">
            Deal Title
          </label>
          <input
            id="deal-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Evening Mystery Pastry Bag or Chef Dum Biryani"
            className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="deal-desc" className="text-label-sm font-bold text-on-surface">
            Description
          </label>
          <textarea
            id="deal-desc"
            required
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What delicious food items might customers find inside?"
            className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        {/* Image Selector: Category Presets + Custom Upload */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-label-sm font-bold text-on-surface">Deal Image</label>
            <span className="text-[11px] text-on-surface-variant">
              Select category preset or upload your own
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* Category presets */}
            {activePresets.map((img, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setImageUrl(img)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  imageUrl === img
                    ? 'border-primary ring-2 ring-primary/20 scale-105'
                    : 'border-outline-variant/40 opacity-70 hover:opacity-100'
                }`}
                title={`Preset Image ${idx + 1}`}
              >
                <img
                  src={img}
                  alt={`Preset ${idx + 1}`}
                  onError={(e) => handleImageError(e, CATEGORY_PRESET_IMAGES.meal[0])}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}

            {/* Custom Uploaded Image Thumbnail (if uploaded) */}
            {customImageUrl && (
              <div
                className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all group ${
                  imageUrl === customImageUrl
                    ? 'border-primary ring-2 ring-primary/20 scale-105'
                    : 'border-outline-variant/40 opacity-80 hover:opacity-100'
                }`}
                title="Your Custom Uploaded Image"
              >
                <img
                  src={customImageUrl}
                  alt="Custom uploaded deal"
                  onClick={() => setImageUrl(customImageUrl)}
                  className="w-full h-full object-cover cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleRemoveCustomImage}
                  title="Remove uploaded image"
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-bold shadow-xs hover:bg-red-700 transition-colors"
                >
                  ×
                </button>
              </div>
            )}

            {/* + Add Image button at the end */}
            <label
              className={`w-14 h-14 rounded-xl shrink-0 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                isUploadingImage
                  ? 'border-primary bg-primary/10 animate-pulse'
                  : 'border-outline-variant/60 hover:border-primary bg-surface hover:bg-primary/5 text-on-surface-variant hover:text-primary'
              }`}
              title="Upload custom image (JPG, PNG, WebP — max 5MB)"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploadingImage}
              />
              {isUploadingImage ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[19px]">add_photo_alternate</span>
                  <span className="text-[9px] font-bold mt-0.5 leading-none">+ Add</span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Pricing in INR (₹) */}
        <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Pricing & Savings (INR ₹)
            </span>
            {discountPercent > 0 && (
              <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                {discountPercent}% OFF • Save ₹{savingsInr}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="orig-price" className="text-xs text-on-surface-variant">Original Price (₹)</label>
              <input
                id="orig-price"
                type="number"
                min="10"
                value={originalPriceInr}
                onChange={(e) => setOriginalPriceInr(Number(e.target.value))}
                className="px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-sm font-bold text-on-surface"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="deal-price" className="text-xs text-on-surface-variant font-bold text-primary">Deal Price (₹)</label>
              <input
                id="deal-price"
                type="number"
                min="5"
                value={surplusPriceInr}
                onChange={(e) => setSurplusPriceInr(Number(e.target.value))}
                className="px-3 py-1.5 bg-surface border-2 border-primary rounded-lg text-sm font-bold text-primary"
              />
            </div>
          </div>
        </div>

        {/* Portions & Pickup Window */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="quantity" className="text-xs font-bold text-on-surface">Portions Available</label>
            <input
              id="quantity"
              type="number"
              min="1"
              max="100"
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(Number(e.target.value))}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-bold text-on-surface"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="start-time" className="text-xs font-bold text-on-surface">Pickup From</label>
            <input
              id="start-time"
              type="time"
              value={pickupStartTime}
              onChange={(e) => setPickupStartTime(e.target.value)}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="end-time" className="text-xs font-bold text-on-surface">Pickup Until</label>
            <input
              id="end-time"
              type="time"
              value={pickupEndTime}
              onChange={(e) => setPickupEndTime(e.target.value)}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface"
            />
          </div>
        </div>

        {/* Dietary Tag */}
        <div className="flex flex-col gap-1.5">
          <label className="text-label-sm font-bold text-on-surface">Dietary Notice</label>
          <div className="flex flex-wrap gap-1.5">
            {['Vegetarian Friendly', '100% Pure Veg', 'Freshly Prepared', 'Freshly Baked', 'Nut-Free', 'Chef Special'].map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => setDietaryTag(tag)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                  dietaryTag === tag
                    ? 'bg-secondary text-on-secondary font-bold'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3">
          <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading ? (isEditing ? 'Saving...' : 'Publishing...') : (isEditing ? 'Save Changes' : 'Publish Food Deal')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateDealModal;
