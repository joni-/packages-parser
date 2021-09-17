import { useRouter } from "next/router";

const PackagePage = () => {
  const router = useRouter();
  const { pkg } = router.query;
  return <h1>Display package details here: {pkg}</h1>;
};

export default PackagePage;
