import { Paragraph } from "../parser/parser";
import { paragraph2 } from "../mocks";
import { GetServerSideProps } from "next";

interface Props {
  paragraph: Paragraph;
}

const PackageDetails = (props: Props) => {
  const { name, description } = props.paragraph;
  return (
    <div>
      <a href="/">Back to packages listing</a>
      <h1>{name}</h1>
      <h3>{description.synopsis}</h3>
      <p>{description.description}</p>
    </div>
  );
};

export default PackageDetails;

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  return {
    props: { paragraph: paragraph2 },
  };
};
