import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  InlineStack,
  TextField,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopConfig = await prisma.shopConfig.findUnique({
      where: { shop: session.shop }
  });

  return json({ shopConfig });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const basePrice = Number(formData.get("basePrice"));
  const techniquesPricing = formData.get("techniquesPricing") as string;

  await prisma.shopConfig.upsert({
    where: { shop: session.shop },
    update: { basePrice, techniquesPricing },
    create: { shop: session.shop, basePrice, techniquesPricing }
  });

  return json({ success: true });
};

export default function Index() {
  const { shopConfig } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const [basePrice, setBasePrice] = useState(shopConfig?.basePrice?.toString() || "589000");
  const [techniques, setTechniques] = useState(
      shopConfig?.techniquesPricing ? JSON.parse(shopConfig.techniquesPricing) : [
        { id: 'embroidery', name: 'Đồ thêu', priceAdd: 50000 },
        { id: '3d-embroidery', name: '3D Embroidery', priceAdd: 80000 },
        { id: 'patch', name: 'Chỉnh sửa bản vá', priceAdd: 120000 },
        { id: 'dtf', name: 'DTF - Transfer Print', priceAdd: 30000 },
        { id: 'engraving', name: 'Điêu khắc', priceAdd: 40000 },
      ]
  );

  const handleTechPriceChange = (index: number, value: string) => {
      const newTechs = [...techniques];
      newTechs[index].priceAdd = Number(value);
      setTechniques(newTechs);
  };

  const isSaving = fetcher.state === "submitting";

  const handleSave = () => {
      fetcher.submit(
          { 
              basePrice, 
              techniquesPricing: JSON.stringify(techniques) 
          }, 
          { method: "POST" }
      );
  };

  return (
    <Page title="Caper Designer Dashboard">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Cấu hình Giá Bán chung</Text>
                <Text as="p" variant="bodyMd">
                  Thiết lập mức giá khởi điểm cho các phôi mũ chưa tùy chỉnh nội dung.
                </Text>
                <TextField
                    label="Giá gốc phôi mũ (VND)"
                    type="number"
                    value={basePrice}
                    onChange={(val) => setBasePrice(val)}
                    autoComplete="off"
                />
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Hướng dẫn tích hợp</Text>
                <Text as="p" variant="bodyMd">
                  Sau khi cài cấu hình, hãy quay về <b>Theme Editor</b>, mở một trang sản phẩm và thêm Block <b>Caper Hat Designer</b>. Mọi thứ sẽ tự động đồng bộ hóa qua App Proxy.
                </Text>
                <Button url={`shopify:admin/themes/current/editor?context=apps`} variant="primary">
                  Mở Theme Editor
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
                <BlockStack gap="400">
                    <Text as="h2" variant="headingMd">Cấu hình Bảng giá Kỹ thuật</Text>
                    <Text as="p" variant="bodyMd">Điều chỉnh các phụ phí tương ứng cho mỗi loại kỹ thuật mà khách hàng thiết kế lên mũ.</Text>
                    <Divider />
                    {techniques.map((tech: any, index: number) => (
                        <InlineStack key={tech.id} align="space-between" blockAlign="center">
                            <Box minWidth="200px">
                                <Text as="p" fontWeight="bold">{tech.name}</Text>
                            </Box>
                            <Box width="200px">
                                <TextField
                                    labelHidden
                                    label="Phụ phí"
                                    type="number"
                                    value={tech.priceAdd.toString()}
                                    onChange={(val) => handleTechPriceChange(index, val)}
                                    autoComplete="off"
                                    suffix="đ"
                                />
                            </Box>
                        </InlineStack>
                    ))}
                    
                    <Box paddingBlockStart="400">
                        <Button variant="primary" onClick={handleSave} loading={isSaving}>
                            Lưu Cấu hình
                        </Button>
                    </Box>
                </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
