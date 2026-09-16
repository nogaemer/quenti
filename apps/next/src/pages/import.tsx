// apps/next/src/pages/import.tsx
//
// Thin page shell — mirrors create.tsx's structure exactly (dynamic,
// ssr:false module import wrapped in AuthedPage + LazyWrapper + WithFooter).
import dynamic from "next/dynamic";

import { HeadSeo } from "@quenti/components/head-seo";

import { Container } from "@chakra-ui/react";

import { LazyWrapper } from "../common/lazy-wrapper";
import { PageWrapper } from "../common/page-wrapper";
import { AuthedPage } from "../components/authed-page";
import { WithFooter } from "../components/with-footer";
import { getLayout } from "../layouts/main-layout";

const InternalKlettImport = dynamic(
  () =>
    import("../modules/klett-import").then((mod) => mod.InternalKlettImport),
  { ssr: false },
);

const Import = () => {
  return (
    <AuthedPage>
      <HeadSeo title="Import from Klett" />
      <LazyWrapper>
        <WithFooter>
          <Container maxW="7xl">
            <InternalKlettImport />
          </Container>
        </WithFooter>
      </LazyWrapper>
    </AuthedPage>
  );
};

Import.PageWrapper = PageWrapper;
Import.getLayout = getLayout;

export default Import;
