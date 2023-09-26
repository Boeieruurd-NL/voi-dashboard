import { Card, Title, Text, Grid, Col } from "@tremor/react";

export default function HoldersTab() {
  return (
    <main>
      <Text className="my-6">Coming soon.</Text>

      <Grid numItemsLg={1} className="gap-6 mt-6">
        {/* Main section */}
        <Col numColSpanLg={1}>
          <Card className="h-full">
            <div className="h-60" />
          </Card>
        </Col>
      </Grid>
    </main>
  );
}