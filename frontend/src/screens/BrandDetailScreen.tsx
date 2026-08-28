import { BrandDetail } from "../components/BrandDetail/BrandDetail";
import { CommonLayout } from "../components/CommonLayout/CommonLayout";
import { useBrand } from "../services/BrandServices";

type Props = {
  id: string;
};

export const BrandDetailScreen = ({ id }: Props) => {
  const brandData = useBrand(id);

  return (
    <CommonLayout>
      {brandData.isLoading ? (
        "Loading..."
      ) : !brandData.data ? (
        "Data load failed"
      ) : (
        <BrandDetail brand={brandData.data} />
      )}
    </CommonLayout>
  );
};
