import type { GetServerSideProps, NextPage } from "next";
import { Paragraph } from "../parser/parser";
import { listPackages } from "../parser/reader";

interface Props {
  paragraphs: Paragraph[];
}

const PackageListing: NextPage<Props> = (props) => {
  return (
    <div>
      <h1>Packages</h1>
      <ul>
        {props.paragraphs.map((p) => (
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
  const paragraphs = await listPackages();
  return {
    props: { paragraphs },
  };
};
