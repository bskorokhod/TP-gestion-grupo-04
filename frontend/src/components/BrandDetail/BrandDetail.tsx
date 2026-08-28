import { Brand } from "@/models/Brand";

type Props = {
  brand: Brand;
};

export const BrandDetail = ({ brand }: Props) => {
  return (
    <ul>
      {Object.entries(brand).map((entry) => {
        const [key, value] = entry;
        return (
          <li key={key}>
            {key}: {value}
          </li>
        );
      })}
    </ul>
  );
};
