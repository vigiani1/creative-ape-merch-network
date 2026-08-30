"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

export async function saveStoreDesign(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const input=z.object({
    storeId:z.string().uuid(),
    logoUrl:z.string().trim().max(1000).optional(),
    heroImageUrl:z.string().trim().max(1000).optional(),
    primaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),
    backgroundColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),
    textColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),
    headingFontFamily:z.string().trim().max(200),
    bodyFontFamily:z.string().trim().max(200),
    currency:z.string().trim().max(8),
    freeShippingThresholdCents:z.string(),
    cartNote:z.string().trim().max(500).optional(),
    checkoutButtonLabel:z.string().trim().max(80),
    continueShoppingLabel:z.string().trim().max(80),
  }).parse({
    storeId:formData.get("storeId"),
    logoUrl:String(formData.get("logoUrl") ?? "") || undefined,
    heroImageUrl:String(formData.get("heroImageUrl") ?? "") || undefined,
    primaryColor:formData.get("primaryColor"),
    secondaryColor:formData.get("secondaryColor"),
    accentColor:formData.get("accentColor"),
    backgroundColor:formData.get("backgroundColor"),
    textColor:formData.get("textColor"),
    headingFontFamily:formData.get("headingFontFamily"),
    bodyFontFamily:formData.get("bodyFontFamily"),
    currency:formData.get("currency"),
    freeShippingThresholdCents:String(formData.get("freeShippingThresholdCents") ?? ""),
    cartNote:String(formData.get("cartNote") ?? "") || undefined,
    checkoutButtonLabel:formData.get("checkoutButtonLabel"),
    continueShoppingLabel:formData.get("continueShoppingLabel"),
  });

  const threshold=input.freeShippingThresholdCents.trim()===""
    ? null
    : Math.max(0,Math.round(Number(input.freeShippingThresholdCents)*100));

  const { error }=await supabase.rpc("save_admin_store_theme_v2",{
    target_store_id:input.storeId,
    theme_data:{
      logoUrl:input.logoUrl ?? "",
      heroImageUrl:input.heroImageUrl ?? "",
      primaryColor:input.primaryColor,
      secondaryColor:input.secondaryColor,
      accentColor:input.accentColor,
      backgroundColor:input.backgroundColor,
      textColor:input.textColor,
      headingFontFamily:input.headingFontFamily,
      bodyFontFamily:input.bodyFontFamily,
    },
    commerce_data:{
      currency:input.currency,
      freeShippingThresholdCents:threshold,
      cartNote:input.cartNote ?? "",
      checkoutButtonLabel:input.checkoutButtonLabel,
      continueShoppingLabel:input.continueShoppingLabel,
    },
  });

  if(error) throw new Error(error.message);
  revalidatePath("/admin/store-design");
  redirect(`/admin/store-design?store=${input.storeId}&saved=1`);
}
