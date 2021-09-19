import { Package, Reference } from "../parser/types";
import { GetServerSideProps } from "next";
import { findPackage } from "../parser/reader";
import { isFailure } from "../parser/result";
import { isEmpty } from "../util";

interface Props {
  package: Package;
}

const Alternatives = ({
  alternatives,
}: {
  alternatives: Reference["alternatives"];
}) => {
  if (isEmpty(alternatives)) {
    return null;
  }
  return (
    <>
      (
      {alternatives.map((alt, i, arr) => (
        <span key={alt.name}>
          {alt.installed && <a href={`/${alt.name}`}>{alt.name}</a>}
          {!alt.installed && alt.name}
          {i < arr.length - 1 && ", "}
        </span>
      ))}
      )
    </>
  );
};

const References = ({
  title,
  references,
}: {
  title: string;
  references: Reference[];
}) => {
  if (isEmpty(references)) {
    return null;
  }
  return (
    <>
      <h4>{title}</h4>
      <ul>
        {references.map((r) => (
          <li key={r.name}>
            {r.installed && <a href={`/${r.name}`}>{r.name}</a>}
            {!r.installed && r.name}{" "}
            <Alternatives alternatives={r.alternatives} />
          </li>
        ))}
      </ul>
    </>
  );
};

const PackageDetails = (props: Props) => {
  const { name, description, depends, dependants } = props.package;
  return (
    <div>
      <a href="/">Back to packages listing</a>
      <h1>{name}</h1>
      <h3>{description.synopsis}</h3>
      <pre>{description.description}</pre>
      <References title="Depends on" references={depends} />
      <References title="Dependants" references={dependants} />
    </div>
  );
};

export default PackageDetails;

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const { pkg } = context.query;

  if (typeof pkg !== "string") {
    return {
      notFound: true,
    };
  }

  const result = await findPackage(pkg);

  if (isFailure(result)) {
    throw new Error(result.message);
  } else if (result.value === null) {
    return { notFound: true };
  }

  return {
    props: { package: result.value },
  };
};
