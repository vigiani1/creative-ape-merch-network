export type PublicStore = {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  slug: string;
};

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  retail_price: number;
  featured?: boolean;
};

export type PublicVariant = {
  id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  price_override: number | null;
  availability_status: "available";
};
