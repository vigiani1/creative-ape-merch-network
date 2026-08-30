"use client";

import { useMemo, useState } from "react";
import { createMerchandisingProduct } from "@/app/admin/products/new/actions";
import { ImageUploader } from "@/components/admin/image-uploader";

type Setup = {
  organizations?: Array<{ id: string; name: string }>;
  stores?: Array<{ id: string; name: string; organizationId: string }>;
  categories?: Array<{ id: string; name: string }>;
  collections?: Array<{ id: string; name: string; organizationId: string }>;
  standardSizes?: string[];
};

type ColorRow = {
  id: string;
  name: string;
  imageUrl: string;
};

export function NewProductForm({ setup, selectedStoreId }: { setup: Setup; selectedStoreId?: string }) {
  const organizations = setup.organizations ?? [];
  const selectedStore = (setup.stores ?? []).find((store) => store.id === selectedStoreId);
  const [organizationId, setOrganizationId] = useState(selectedStore?.organizationId ?? organizations[0]?.id ?? "");
  const [colors, setColors] = useState<ColorRow[]>([{ id: crypto.randomUUID(), name: "", imageUrl: "" }]);

  const stores = useMemo(
    () => (setup.stores ?? []).filter((store) => store.organizationId === organizationId),
    [setup.stores, organizationId],
  );
  const collections = useMemo(
    () => (setup.collections ?? []).filter((collection) => collection.organizationId === organizationId),
    [setup.collections, organizationId],
  );

  const colorsJson = JSON.stringify(
    colors
      .map((color, index) => ({
        name: color.name.trim(),
        imageUrl: color.imageUrl.trim(),
        displayOrder: (index + 1) * 10,
      }))
      .filter((color) => color.name)
  );

  return (
    <form action={createMerchandisingProduct} className="admin-product-form">
      <input type="hidden" name="colorsJson" value={colorsJson} />

      <section className="admin-editor-section">
        <div className="admin-editor-section__head">
          <span>01</span>
          <div>
            <h3>Product</h3>
            <p>The basic information shoppers will see.</p>
          </div>
        </div>

        <div className="admin-editor-fields">
          <label className="admin-field admin-field--wide">
            <span>Product name</span>
            <input name="name" required placeholder="Gridley Titans Hoodie" />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Description</span>
            <textarea name="description" rows={5} placeholder="Describe the product, fit, material, or artwork." />
          </label>
          <label className="admin-field">
            <span>Category</span>
            <select name="categoryId" defaultValue="">
              <option value="">Select category</option>
              {(setup.categories ?? []).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head">
          <span>02</span>
          <div>
            <h3>Pricing</h3>
            <p>Retail and internal production cost.</p>
          </div>
        </div>

        <div className="admin-editor-fields admin-editor-fields--two">
          <label className="admin-field">
            <span>Price</span>
            <div className="admin-money-input"><b>$</b><input name="price" type="number" min="0" step="0.01" required placeholder="25.00" /></div>
          </label>
          <label className="admin-field">
            <span>Cost</span>
            <div className="admin-money-input"><b>$</b><input name="cost" type="number" min="0" step="0.01" placeholder="10.00" /></div>
          </label>
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head">
          <span>03</span>
          <div>
            <h3>Media</h3>
            <p>Upload the main product image now. You can add more images later.</p>
          </div>
        </div>
        <div className="admin-editor-fields">
          <ImageUploader
            organizationId={organizationId}
            urlInputName="productImageUrl"
            assetIdInputName="productImageAssetId"
            label="Upload Product Image"
          />
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head">
          <span>04</span>
          <div>
            <h3>Size</h3>
            <p>Select every size offered for this product.</p>
          </div>
        </div>

        <div className="admin-size-options">
          {(setup.standardSizes ?? ["Small","Medium","Large","XL","2XL","3XL","4XL"]).map((size) => (
            <label key={size}>
              <input type="checkbox" name="sizes" value={size} />
              <span>{size}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head">
          <span>05</span>
          <div>
            <h3>Color</h3>
            <p>Add the colors customers can choose from.</p>
          </div>
        </div>

        <div className="admin-color-rows">
          {colors.map((color, index) => (
            <div key={color.id} className="admin-color-row">
              <label className="admin-field">
                <span>Color {index + 1}</span>
                <input
                  value={color.name}
                  onChange={(event) => setColors((current) => current.map((row) =>
                    row.id === color.id ? { ...row, name: event.target.value } : row
                  ))}
                  placeholder="Black"
                />
              </label>
              <label className="admin-field admin-field--wide">
                <span>Color image URL <em>Optional</em></span>
                <input
                  value={color.imageUrl}
                  onChange={(event) => setColors((current) => current.map((row) =>
                    row.id === color.id ? { ...row, imageUrl: event.target.value } : row
                  ))}
                  placeholder="Assign through Media after creation"
                />
              </label>
              {colors.length > 1 ? (
                <button
                  type="button"
                  className="admin-row-remove"
                  onClick={() => setColors((current) => current.filter((row) => row.id !== color.id))}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}

          <button
            type="button"
            className="admin-add-row"
            onClick={() => setColors((current) => [...current, { id: crypto.randomUUID(), name: "", imageUrl: "" }])}
          >
            + Add Color
          </button>
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head">
          <span>06</span>
          <div>
            <h3>Organization & Store</h3>
            <p>Choose where this product belongs and where it will be sold.</p>
          </div>
        </div>

        <div className="admin-editor-fields admin-editor-fields--two">
          <label className="admin-field">
            <span>Organization</span>
            <select name="organizationId" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} required>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>{organization.name}</option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Store</span>
            <select name="storeId" key={organizationId} defaultValue={stores.some((store)=>store.id===selectedStoreId) ? selectedStoreId : stores[0]?.id ?? ""} required>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </label>
        </div>

        {collections.length ? (
          <div className="admin-collection-options">
            <p>Collections</p>
            <div>
              {collections.map((collection) => (
                <label key={collection.id}>
                  <input type="checkbox" name="collectionIds" value={collection.id} />
                  <span>{collection.name}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-section__head">
          <span>07</span>
          <div>
            <h3>Publishing</h3>
            <p>Save as a draft or make it available immediately.</p>
          </div>
        </div>

        <div className="admin-editor-fields admin-editor-fields--two">
          <label className="admin-field">
            <span>Status</span>
            <select name="status" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label className="admin-check-row">
            <input type="checkbox" name="featured" />
            <span>Feature this product</span>
          </label>
        </div>
      </section>

      <div className="admin-editor-savebar">
        <a href={selectedStoreId ? `/admin/products?store=${selectedStoreId}` : "/admin/products"}>Cancel</a>
        <button type="submit">Create Product</button>
      </div>
    </form>
  );
}
