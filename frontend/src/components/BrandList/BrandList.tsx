import { Link } from "wouter";

import { Brand } from "../../models/Brand";

type Props = {
  brands: Brand[];
};

export const BrandList = ({ brands }: Props) => {
  return (
    <>
      <Link href="/brands/new">Add a new Brand</Link>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((brand) => (
            <BrandLine key={brand.id} brand={brand} />
          ))}
        </tbody>
      </table>
    </>
  );
};

const BrandLine = ({ brand }: { brand: Brand }) => {
  return (
    <tr>
      <td>{brand.id}</td>
      <td>
        <Link href={`/brands/${brand.id}`}>{brand.name}</Link>
      </td>
    </tr>
  );
};
