import type { GetServerSideProps, NextPage } from "next";
import { Package } from "../parser/parser";
import { listPackages } from "../parser/reader";

interface Props {
  packages: Package[];
}

const PackageListing: NextPage<Props> = (props) => {
  return (
    <div>
      <h1>Packages</h1>
      <ul>
        {props.packages.map((p) => (
          <li key={p.name}>
            <a href={`/${p.name}`}>{p.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PackageListing;

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const packages = await listPackages();
  return {
    props: { packages },
  };
};
