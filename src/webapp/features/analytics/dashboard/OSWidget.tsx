import { useSearchParams } from "react-router-dom";
import { TopNDataContainer } from "./TopNDataContainer";
import { topOSVersions, topOperatingSystem } from "../query";
import { OS } from "./OS";
import { TopNChart } from "./TopNChart";
import { TopNTitle } from "./TopNTitle";

type Props = {
  appId: string;
};

export function OSWidget(props: Props) {
  const [searchParams] = useSearchParams();
  const osName = searchParams.get("osName") || "";

  if (osName) {
    return (
      <TopNDataContainer appId={props.appId} queryName="top-osversions" query={topOSVersions}>
        {(data) => (
          <TopNChart
            {...data}
            id="osversions"
            key="osversions"
            title={
              <TopNTitle backProperty="osName">
                <OS name={osName} />
              </TopNTitle>
            }
            defaultFormat="percentage"
            valueLabel="Sessões"
          />
        )}
      </TopNDataContainer>
    );
  }

  return (
    <TopNDataContainer appId={props.appId} queryName="top-operatingsystems" query={topOperatingSystem}>
      {(data) => (
        <TopNChart
          {...data}
          id="osnames"
          title="Sistemas Operacionais"
          searchParamKey="osName"
          defaultFormat="percentage"
          valueLabel="Sessões"
          renderRow={(item) => <OS name={item.name} />}
        />
      )}
    </TopNDataContainer>
  );
}
