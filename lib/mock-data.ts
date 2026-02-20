import type { CategoryId, OrderStatus, QuoteStatus } from "./constants"

/* ------------------------------------------------------------------ */
/*  Product types                                                      */
/* ------------------------------------------------------------------ */

export interface BrandingPosition {
  id: string
  label: string
  description: string
}

export interface Product {
  id: string
  sku: string
  name: string
  description: string
  category: CategoryId
  price: number // excl. VAT, in ZAR
  images: string[]
  colors: string[]
  sizes: string[]
  stockLevel: "in-stock" | "low-stock" | "out-of-stock"
  minOrderQty: number
  brandingPositions: BrandingPosition[]
  featured: boolean
}

/* ------------------------------------------------------------------ */
/*  Order / Quote types                                                */
/* ------------------------------------------------------------------ */

export interface OrderItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  color: string
  size: string
  unitPrice: number
}

export interface Order {
  id: string
  orderNumber: string
  date: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  vat: number
  total: number
  shippingAddress: string
}

export interface QuoteItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  color: string
  size: string
  brandingNotes: string
  brandingPosition: string
}

export interface QuoteRequest {
  id: string
  quoteNumber: string
  date: string
  status: QuoteStatus
  items: QuoteItem[]
  deadline: string
  specialInstructions: string
  estimatedTotal: number | null
  contactName: string
  contactEmail: string
  companyName: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  companyName: string
  vatNumber: string
  phone: string
  address: string
}

/* ------------------------------------------------------------------ */
/*  Mock product data (24 products)                                    */
/* ------------------------------------------------------------------ */

// Commercial-use image URLs from Unsplash for different product categories
const PRODUCT_IMAGES = {
  "apparel": [
    "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1594940453139-4f1d9ad63af2?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&auto=format"
  ],
  "bags": [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1552063026-56bf5cb7607d?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop&auto=format"
  ],
  "drinkware": [
    "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1527960674768-5b69250adfe1?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1514228742587-6b1558fcf8b2?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1525373612132-b3e820b87cea?w=400&h=400&fit=crop&auto=format"
  ],
  "tech": [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1598928424272-9e667b5176b7?w=400&h=400&fit=crop&auto=format"
  ],
  "stationery": [
    "https://images.unsplash.com/photo-1523435288958-0a8798752a1a?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1504382262782-5b5ece6f7a09?w=400&h=400&fit=crop&auto=format"
  ],
  "outdoor": [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop&auto=format"
  ]
}

function getProductImage(category: string, index: number): string[] {
  // Fallback to category images
  const categoryImages = PRODUCT_IMAGES[category as keyof typeof PRODUCT_IMAGES] || PRODUCT_IMAGES.apparel
  const imageIndex = index % categoryImages.length
  
  // For now, return category-based images with better fallback logic
  // The product cards will handle fallback to placeholder if images don't match well
  return [categoryImages[imageIndex]]
}

export const MOCK_PRODUCTS: Product[] = [
  // --- Apparel ---
  {
    id: "prod-001",
    sku: "ALT-BGM-001",
    name: "Altitude Balmoral Golf Shirt - Mens",
    description:
      "Premium 180g pique-knit mens golf shirt with a classic fit. Ideal for corporate events, golf days and everyday branding. Features a reinforced three-button placket and side slits for comfort.",
    category: "apparel",
    price: 89.0,
    images: getProductImage("apparel", 0),
    colors: ["White", "Navy", "Black", "Red", "Royal Blue"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    stockLevel: "in-stock",
    minOrderQty: 20,
    brandingPositions: [
      { id: "bp-lc", label: "Left Chest", description: "8cm x 8cm embroidery area" },
      { id: "bp-back", label: "Back", description: "30cm x 30cm print area" },
      { id: "bp-rs", label: "Right Sleeve", description: "8cm x 4cm embroidery area" },
    ],
    featured: true,
  },
  {
    id: "prod-002",
    sku: "ALT-BGF-002",
    name: "Altitude Balmoral Golf Shirt - Ladies",
    description:
      "Ladies version of the popular Balmoral golf shirt. Feminine fit with a tailored silhouette. 180g pique-knit fabric with a V-neck collar.",
    category: "apparel",
    price: 89.0,
    images: getProductImage("apparel", 1),
    colors: ["White", "Navy", "Black", "Pink", "Sky Blue"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    stockLevel: "in-stock",
    minOrderQty: 20,
    brandingPositions: [
      { id: "bp-lc", label: "Left Chest", description: "8cm x 8cm embroidery area" },
      { id: "bp-back", label: "Back", description: "30cm x 30cm print area" },
    ],
    featured: false,
  },
  {
    id: "prod-003",
    sku: "ALT-CRW-003",
    name: "Altitude Crew Neck Sweater",
    description:
      "280g brushed fleece crew neck sweater. A wardrobe staple for winter branding. Ribbed cuffs and waistband for a clean finish.",
    category: "apparel",
    price: 119.0,
    images: getProductImage("apparel", 2),
    colors: ["Black", "Navy", "Grey Melange", "Charcoal"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    stockLevel: "in-stock",
    minOrderQty: 20,
    brandingPositions: [
      { id: "bp-lc", label: "Left Chest", description: "10cm x 10cm print or embroidery area" },
      { id: "bp-back", label: "Back", description: "35cm x 35cm print area" },
    ],
    featured: true,
  },
  {
    id: "prod-004",
    sku: "ALT-HDY-004",
    name: "Altitude Zip-Through Hoodie",
    description:
      "350g brushed fleece zip-through hoodie with kangaroo pockets and drawstring hood. Perfect for outdoor events and casual corporate wear.",
    category: "apparel",
    price: 159.0,
    images: getProductImage("apparel", 3),
    colors: ["Black", "Navy", "Charcoal"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    stockLevel: "low-stock",
    minOrderQty: 15,
    brandingPositions: [
      { id: "bp-lc", label: "Left Chest", description: "8cm x 8cm embroidery area" },
      { id: "bp-back", label: "Back", description: "35cm x 40cm print area" },
    ],
    featured: false,
  },

  // --- Bags ---
  {
    id: "prod-005",
    sku: "US-TOT-005",
    name: "US Basic Conference Tote",
    description:
      "Affordable non-woven conference tote bag with long handles. Lightweight and ideal for events, trade shows and corporate gifting.",
    category: "bags",
    price: 18.0,
    images: getProductImage("bags", 0),
    colors: ["Black", "Navy", "Red", "White", "Green"],
    sizes: ["One Size"],
    stockLevel: "in-stock",
    minOrderQty: 50,
    brandingPositions: [
      { id: "bp-front", label: "Front Panel", description: "25cm x 25cm print area" },
    ],
    featured: true,
  },
  {
    id: "prod-006",
    sku: "US-BPK-006",
    name: "US Basic Oregon Backpack",
    description:
      "Durable 600D polyester backpack with padded shoulder straps and a front zip pocket. Great for everyday use and corporate gifts.",
    category: "bags",
    price: 79.0,
    images: getProductImage("bags", 1),
    colors: ["Black", "Navy", "Grey"],
    sizes: ["One Size"],
    stockLevel: "in-stock",
    minOrderQty: 25,
    brandingPositions: [
      { id: "bp-front", label: "Front Pocket", description: "15cm x 15cm print area" },
      { id: "bp-main", label: "Main Compartment", description: "20cm x 25cm print area" },
    ],
    featured: false,
  },
  {
    id: "prod-007",
    sku: "ALT-DFL-007",
    name: "Altitude Duffel Bag",
    description:
      "Spacious 600D polyester duffel bag with adjustable shoulder strap. Multiple compartments for gym use or travel. Available for branding on front panel.",
    category: "bags",
    price: 129.0,
    images: getProductImage("bags", 2),
    colors: ["Black", "Navy"],
    sizes: ["One Size"],
    stockLevel: "low-stock",
    minOrderQty: 20,
    brandingPositions: [
      { id: "bp-front", label: "Front Panel", description: "20cm x 15cm print area" },
      { id: "bp-side", label: "Side Panel", description: "12cm x 10cm embroidery area" },
    ],
    featured: false,
  },
  {
    id: "prod-008",
    sku: "US-CLR-008",
    name: "US Basic Cooler Bag - 6 Can",
    description:
      "Insulated cooler bag that holds 6 standard cans. PEVA lining keeps drinks cold for hours. Ideal for outdoor events and gifting.",
    category: "bags",
    price: 45.0,
    images: getProductImage("bags", 3),
    colors: ["Black", "Red", "Blue"],
    sizes: ["One Size"],
    stockLevel: "in-stock",
    minOrderQty: 30,
    brandingPositions: [
      { id: "bp-front", label: "Front Panel", description: "15cm x 12cm print area" },
    ],
    featured: false,
  },

  // --- Drinkware ---
  {
    id: "prod-009",
    sku: "ALT-TMB-009",
    name: "Altitude Vienna Stainless Steel Tumbler",
    description:
      "500ml double-wall vacuum-insulated stainless steel tumbler with sliding lid. Keeps drinks hot for 12 hours or cold for 24 hours.",
    category: "drinkware",
    price: 89.0,
    images: getProductImage("drinkware", 0),
    colors: ["Silver", "Black", "White", "Rose Gold"],
    sizes: ["500ml"],
    stockLevel: "in-stock",
    minOrderQty: 25,
    brandingPositions: [
      { id: "bp-wrap", label: "Full Wrap", description: "Laser engraving or full colour print" },
    ],
    featured: true,
  },
  {
    id: "prod-010",
    sku: "US-WBT-010",
    name: "US Basic Hydration Water Bottle",
    description:
      "750ml BPA-free Tritan water bottle with flip-top lid. Lightweight, durable and perfect for everyday hydration at the office or gym.",
    category: "drinkware",
    price: 35.0,
    images: getProductImage("drinkware", 1),
    colors: ["Clear", "Blue", "Green", "Black"],
    sizes: ["750ml"],
    stockLevel: "in-stock",
    minOrderQty: 50,
    brandingPositions: [
      { id: "bp-body", label: "Body", description: "Full colour wrap print" },
    ],
    featured: false,
  },
  {
    id: "prod-011",
    sku: "ALT-CMG-011",
    name: "Altitude Ceramic Coffee Mug",
    description:
      "325ml ceramic coffee mug with a glossy finish. The classic corporate gift. Microwave and dishwasher safe.",
    category: "drinkware",
    price: 29.0,
    images: getProductImage("drinkware", 2),
    colors: ["White", "Black"],
    sizes: ["325ml"],
    stockLevel: "in-stock",
    minOrderQty: 36,
    brandingPositions: [
      { id: "bp-side", label: "Side Print", description: "Full colour sublimation print" },
    ],
    featured: false,
  },
  {
    id: "prod-012",
    sku: "ALT-HIP-012",
    name: "Altitude Hip Flask Set",
    description:
      "200ml stainless steel hip flask set with 2 shot glasses in a gift box. Premium corporate gifting solution.",
    category: "drinkware",
    price: 135.0,
    images: getProductImage("drinkware", 3),
    colors: ["Silver"],
    sizes: ["200ml"],
    stockLevel: "low-stock",
    minOrderQty: 10,
    brandingPositions: [
      { id: "bp-front", label: "Front", description: "Laser engraving area 5cm x 5cm" },
    ],
    featured: false,
  },

  // --- Tech ---
  {
    id: "prod-013",
    sku: "ALT-PWB-013",
    name: "Altitude 10000mAh Power Bank",
    description:
      "Slim 10000mAh power bank with dual USB output. LED battery indicator and microfibre pouch included. Perfect tech gift.",
    category: "tech",
    price: 159.0,
    images: getProductImage("tech", 0),
    colors: ["Black", "White", "Silver"],
    sizes: ["One Size"],
    stockLevel: "in-stock",
    minOrderQty: 20,
    brandingPositions: [
      { id: "bp-front", label: "Front Face", description: "UV print 8cm x 4cm" },
    ],
    featured: true,
  },
  {
    id: "prod-014",
    sku: "US-USB-014",
    name: "US Basic 16GB USB Flash Drive",
    description:
      "16GB USB 2.0 flash drive with swivel cap. Budget-friendly and ideal for loading presentation files and handing out at events.",
    category: "tech",
    price: 45.0,
    images: getProductImage("tech", 1),
    colors: ["Black", "Blue", "Red", "White"],
    sizes: ["16GB"],
    stockLevel: "in-stock",
    minOrderQty: 50,
    brandingPositions: [
      { id: "bp-body", label: "Body", description: "Pad print 3cm x 1.5cm" },
    ],
    featured: false,
  },
  {
    id: "prod-015",
    sku: "ALT-BTS-015",
    name: "Altitude Bluetooth Speaker",
    description:
      "Portable wireless Bluetooth speaker with 3W output and built-in microphone. USB-C charging. Great sound in a compact size.",
    category: "tech",
    price: 119.0,
    images: getProductImage("tech", 2),
    colors: ["Black", "White", "Blue"],
    sizes: ["One Size"],
    stockLevel: "in-stock",
    minOrderQty: 15,
    brandingPositions: [
      { id: "bp-top", label: "Top Face", description: "Pad print 4cm diameter" },
    ],
    featured: false,
  },
  {
    id: "prod-016",
    sku: "ALT-WCH-016",
    name: "Altitude Wireless Charging Pad",
    description:
      "10W Qi wireless charging pad compatible with all Qi-enabled devices. Slim profile with LED indicator and anti-slip base.",
    category: "tech",
    price: 99.0,
    images: getProductImage("tech", 3),
    colors: ["Black", "White"],
    sizes: ["One Size"],
    stockLevel: "in-stock",
    minOrderQty: 25,
    brandingPositions: [
      { id: "bp-top", label: "Top Surface", description: "Full colour print 6cm diameter" },
    ],
    featured: false,
  },

  // --- Stationery ---
  {
    id: "prod-017",
    sku: "ALT-NBK-017",
    name: "Altitude A5 Hardcover Notebook",
    description:
      "A5 hardcover PU leather notebook with 192 lined pages. Elastic closure band, ribbon bookmark and pen loop. Perfect for corporate gifting.",
    category: "stationery",
    price: 55.0,
    images: getProductImage("stationery", 0),
    colors: ["Black", "Navy", "Tan", "Red"],
    sizes: ["A5"],
    stockLevel: "in-stock",
    minOrderQty: 25,
    brandingPositions: [
      { id: "bp-cover", label: "Front Cover", description: "Deboss or foil stamp 10cm x 10cm" },
    ],
    featured: true,
  },
  {
    id: "prod-018",
    sku: "US-PEN-018",
    name: "US Basic Alaska Ball Pen",
    description:
      "Retractable ballpoint pen with a rubberised barrel for grip comfort. Smooth black ink and click mechanism.",
    category: "stationery",
    price: 8.0,
    images: getProductImage("stationery", 1),
    colors: ["Black", "Blue", "Red", "White", "Green"],
    sizes: ["One Size"],
    stockLevel: "in-stock",
    minOrderQty: 100,
    brandingPositions: [
      { id: "bp-barrel", label: "Barrel", description: "Pad print 5cm x 0.8cm" },
    ],
    featured: false,
  },
  {
    id: "prod-019",
    sku: "ALT-DSK-019",
    name: "Altitude Desktop Organiser Set",
    description:
      "PU leather desktop organiser with pen holder, memo pad holder and card slot. Executive gifting made easy.",
    category: "stationery",
    price: 145.0,
    images: getProductImage("stationery", 2),
    colors: ["Black", "Tan"],
    sizes: ["One Size"],
    stockLevel: "low-stock",
    minOrderQty: 10,
    brandingPositions: [
      { id: "bp-front", label: "Front Panel", description: "Deboss 6cm x 3cm" },
    ],
    featured: false,
  },
  {
    id: "prod-020",
    sku: "US-HLG-020",
    name: "US Basic Highlighter Set (5 Pack)",
    description:
      "Set of 5 chisel-tip highlighters in neon yellow, green, orange, blue and pink. Packaged in a clear PVC pouch for branding.",
    category: "stationery",
    price: 22.0,
    images: getProductImage("stationery", 3),
    colors: ["Multi"],
    sizes: ["One Size"],
    stockLevel: "in-stock",
    minOrderQty: 50,
    brandingPositions: [
      { id: "bp-pouch", label: "PVC Pouch", description: "Full colour insert card 10cm x 5cm" },
    ],
    featured: false,
  },

  // --- Outdoor ---
  {
    id: "prod-021",
    sku: "ALT-CAP-021",
    name: "Altitude Expedition Cap",
    description:
      "6-panel structured cap with pre-curved peak and adjustable Velcro closure. 100% cotton twill. The go-to corporate headwear item.",
    category: "outdoor",
    price: 39.0,
    images: getProductImage("outdoor", 0),
    colors: ["Black", "Navy", "White", "Khaki", "Red"],
    sizes: ["One Size"],
    stockLevel: "in-stock",
    minOrderQty: 30,
    brandingPositions: [
      { id: "bp-front", label: "Front Panel", description: "Embroidery 10cm x 5cm" },
      { id: "bp-side", label: "Side Panel", description: "Embroidery 5cm x 5cm" },
      { id: "bp-back", label: "Back Strap", description: "Embroidery 5cm x 2cm" },
    ],
    featured: true,
  },
  {
    id: "prod-022",
    sku: "US-UMB-022",
    name: "US Basic Auto-Open Golf Umbrella",
    description:
      "Large 68-inch auto-open golf umbrella with fibreglass ribs and a rubberised handle. Windproof and built to last.",
    category: "outdoor",
    price: 89.0,
    images: getProductImage("outdoor", 1),
    colors: ["Black", "Navy", "Red", "Royal Blue"],
    sizes: ["One Size"],
    stockLevel: "in-stock",
    minOrderQty: 20,
    brandingPositions: [
      { id: "bp-panel", label: "Alternating Panels", description: "Screen print 25cm x 25cm per panel" },
    ],
    featured: false,
  },
  {
    id: "prod-023",
    sku: "ALT-BKT-023",
    name: "Altitude Picnic Blanket",
    description:
      "Fleece picnic blanket with waterproof PEVA backing. Folds into a compact carry bag with handle. Great for outdoor events.",
    category: "outdoor",
    price: 99.0,
    images: getProductImage("outdoor", 2),
    colors: ["Red Check", "Blue Check", "Green Check"],
    sizes: ["One Size"],
    stockLevel: "in-stock",
    minOrderQty: 15,
    brandingPositions: [
      { id: "bp-flap", label: "Carry Flap", description: "Embroidery 8cm x 8cm" },
    ],
    featured: false,
  },
  {
    id: "prod-024",
    sku: "ALT-SNS-024",
    name: "Altitude Sunscreen SPF30 (50ml)",
    description:
      "50ml SPF30 sunscreen in a branded tube. Moisturising formula with UVA and UVB protection. Great for outdoor events and wellness hampers.",
    category: "outdoor",
    price: 25.0,
    images: getProductImage("outdoor", 3),
    colors: ["White"],
    sizes: ["50ml"],
    stockLevel: "in-stock",
    minOrderQty: 50,
    brandingPositions: [
      { id: "bp-label", label: "Full Label Wrap", description: "Full colour label 12cm x 4cm" },
    ],
    featured: false,
  },
]

/* ------------------------------------------------------------------ */
/*  Mock orders                                                        */
/* ------------------------------------------------------------------ */

export const MOCK_ORDERS: Order[] = [
  {
    id: "ord-001",
    orderNumber: "LNR-2026-001",
    date: "2026-01-15",
    status: "Delivered",
    items: [
      { productId: "prod-001", productName: "Altitude Balmoral Golf Shirt - Mens", sku: "ALT-BGM-001", quantity: 50, color: "Navy", size: "L", unitPrice: 89.0 },
      { productId: "prod-021", productName: "Altitude Expedition Cap", sku: "ALT-CAP-021", quantity: 50, color: "Navy", size: "One Size", unitPrice: 39.0 },
    ],
    subtotal: 6400.0,
    vat: 960.0,
    total: 7360.0,
    shippingAddress: "123 Main Rd, Sandton, Johannesburg, 2196",
  },
  {
    id: "ord-002",
    orderNumber: "LNR-2026-002",
    date: "2026-02-03",
    status: "Shipped",
    items: [
      { productId: "prod-009", productName: "Altitude Vienna Stainless Steel Tumbler", sku: "ALT-TMB-009", quantity: 100, color: "Silver", size: "500ml", unitPrice: 89.0 },
    ],
    subtotal: 8900.0,
    vat: 1335.0,
    total: 10235.0,
    shippingAddress: "456 Oak Ave, Rosebank, Johannesburg, 2196",
  },
  {
    id: "ord-003",
    orderNumber: "LNR-2026-003",
    date: "2026-02-10",
    status: "Processing",
    items: [
      { productId: "prod-017", productName: "Altitude A5 Hardcover Notebook", sku: "ALT-NBK-017", quantity: 200, color: "Black", size: "A5", unitPrice: 55.0 },
      { productId: "prod-018", productName: "US Basic Alaska Ball Pen", sku: "US-PEN-018", quantity: 200, color: "Black", size: "One Size", unitPrice: 8.0 },
    ],
    subtotal: 12600.0,
    vat: 1890.0,
    total: 14490.0,
    shippingAddress: "789 Jan Smuts Ave, Craighall, Johannesburg, 2196",
  },
  {
    id: "ord-004",
    orderNumber: "LNR-2026-004",
    date: "2026-02-14",
    status: "Paid",
    items: [
      { productId: "prod-013", productName: "Altitude 10000mAh Power Bank", sku: "ALT-PWB-013", quantity: 30, color: "Black", size: "One Size", unitPrice: 159.0 },
    ],
    subtotal: 4770.0,
    vat: 715.5,
    total: 5485.5,
    shippingAddress: "321 Rivonia Blvd, Rivonia, Sandton, 2128",
  },
  {
    id: "ord-005",
    orderNumber: "LNR-2026-005",
    date: "2026-02-17",
    status: "Pending",
    items: [
      { productId: "prod-005", productName: "US Basic Conference Tote", sku: "US-TOT-005", quantity: 500, color: "White", size: "One Size", unitPrice: 18.0 },
    ],
    subtotal: 9000.0,
    vat: 1350.0,
    total: 10350.0,
    shippingAddress: "654 William Nicol Dr, Bryanston, 2191",
  },
]

/* ------------------------------------------------------------------ */
/*  Mock quote requests                                                */
/* ------------------------------------------------------------------ */

export const MOCK_QUOTES: QuoteRequest[] = [
  {
    id: "qr-001",
    quoteNumber: "QR-2026-001",
    date: "2026-01-20",
    status: "Complete",
    items: [
      { productId: "prod-001", productName: "Altitude Balmoral Golf Shirt - Mens", sku: "ALT-BGM-001", quantity: 100, color: "White", size: "Mixed", brandingNotes: "Company logo in full colour on left chest", brandingPosition: "Left Chest" },
      { productId: "prod-021", productName: "Altitude Expedition Cap", sku: "ALT-CAP-021", quantity: 100, color: "White", size: "One Size", brandingNotes: "Same logo on front panel", brandingPosition: "Front Panel" },
    ],
    deadline: "2026-02-15",
    specialInstructions: "For our annual golf day event. Need all items in white to match our theme.",
    estimatedTotal: 14950.0,
    contactName: "John van der Merwe",
    contactEmail: "john@acmecorp.co.za",
    companyName: "Acme Corp SA",
  },
  {
    id: "qr-002",
    quoteNumber: "QR-2026-002",
    date: "2026-01-28",
    status: "In Production",
    items: [
      { productId: "prod-003", productName: "Altitude Crew Neck Sweater", sku: "ALT-CRW-003", quantity: 50, color: "Navy", size: "Mixed", brandingNotes: "Embroidered logo left chest, white thread", brandingPosition: "Left Chest" },
    ],
    deadline: "2026-03-01",
    specialInstructions: "Winter staff uniforms. Please include size breakdown form.",
    estimatedTotal: 7475.0,
    contactName: "Sarah Nkosi",
    contactEmail: "sarah@techstart.co.za",
    companyName: "TechStart Solutions",
  },
  {
    id: "qr-003",
    quoteNumber: "QR-2026-003",
    date: "2026-02-05",
    status: "Quoted",
    items: [
      { productId: "prod-009", productName: "Altitude Vienna Stainless Steel Tumbler", sku: "ALT-TMB-009", quantity: 75, color: "Black", size: "500ml", brandingNotes: "Laser engraved logo on front", brandingPosition: "Full Wrap" },
      { productId: "prod-017", productName: "Altitude A5 Hardcover Notebook", sku: "ALT-NBK-017", quantity: 75, color: "Black", size: "A5", brandingNotes: "Gold foil stamp on cover", brandingPosition: "Front Cover" },
    ],
    deadline: "2026-03-15",
    specialInstructions: "Year-end client gift hampers. Please quote for gift box packaging as well.",
    estimatedTotal: 11100.0,
    contactName: "Michael Botha",
    contactEmail: "michael@safinance.co.za",
    companyName: "SA Finance Group",
  },
  {
    id: "qr-004",
    quoteNumber: "QR-2026-004",
    date: "2026-02-10",
    status: "Pending",
    items: [
      { productId: "prod-005", productName: "US Basic Conference Tote", sku: "US-TOT-005", quantity: 300, color: "Black", size: "One Size", brandingNotes: "Full colour logo both sides", brandingPosition: "Front Panel" },
      { productId: "prod-014", productName: "US Basic 16GB USB Flash Drive", sku: "US-USB-014", quantity: 300, color: "White", size: "16GB", brandingNotes: "Pad print logo on body", brandingPosition: "Body" },
      { productId: "prod-018", productName: "US Basic Alaska Ball Pen", sku: "US-PEN-018", quantity: 300, color: "Blue", size: "One Size", brandingNotes: "Logo on barrel", brandingPosition: "Barrel" },
    ],
    deadline: "2026-04-01",
    specialInstructions: "For our annual industry conference in Cape Town. All items should be packed together in the tote bag.",
    estimatedTotal: null,
    contactName: "Lisa Mbeki",
    contactEmail: "lisa@eventsplus.co.za",
    companyName: "Events Plus",
  },
  {
    id: "qr-005",
    quoteNumber: "QR-2026-005",
    date: "2026-02-15",
    status: "Approved",
    items: [
      { productId: "prod-013", productName: "Altitude 10000mAh Power Bank", sku: "ALT-PWB-013", quantity: 50, color: "White", size: "One Size", brandingNotes: "UV print full colour logo", brandingPosition: "Front Face" },
      { productId: "prod-015", productName: "Altitude Bluetooth Speaker", sku: "ALT-BTS-015", quantity: 50, color: "White", size: "One Size", brandingNotes: "Pad print logo on top", brandingPosition: "Top Face" },
    ],
    deadline: "2026-03-20",
    specialInstructions: "Executive gift boxes for top clients. Please include individual gift boxes with foam inserts.",
    estimatedTotal: 16100.0,
    contactName: "David Pillay",
    contactEmail: "david@innovatetech.co.za",
    companyName: "InnovateTech",
  },
  {
    id: "qr-006",
    quoteNumber: "QR-2026-006",
    date: "2026-02-17",
    status: "Pending",
    items: [
      { productId: "prod-022", productName: "US Basic Auto-Open Golf Umbrella", sku: "US-UMB-022", quantity: 40, color: "Navy", size: "One Size", brandingNotes: "Screen print on alternating panels", brandingPosition: "Alternating Panels" },
    ],
    deadline: "2026-04-10",
    specialInstructions: "Rainy season corporate gifts for Durban office.",
    estimatedTotal: null,
    contactName: "Nomsa Dlamini",
    contactEmail: "nomsa@coastcorp.co.za",
    companyName: "CoastCorp Durban",
  },
]

/* ------------------------------------------------------------------ */
/*  Mock user                                                          */
/* ------------------------------------------------------------------ */

export const MOCK_USER: UserProfile = {
  id: "user-001",
  email: "admin@lenor.co.za",
  name: "Admin User",
  companyName: "Lenor Demo Company",
  vatNumber: "4123456789",
  phone: "+27 11 234 5678",
  address: "100 Main Rd, Sandton, Johannesburg, 2196",
}
