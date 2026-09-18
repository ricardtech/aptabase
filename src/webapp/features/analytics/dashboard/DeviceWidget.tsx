import { TopNDataContainer } from "./TopNDataContainer";
import { topDevices } from "../query";
import { Device } from "./Device";
import { TopNChart } from "./TopNChart";

type Props = {
  appId: string;
};

export function DeviceWidget(props: Props) {
  return (
    <TopNDataContainer appId={props.appId} queryName="top-devices" query={topDevices}>
      {(data) => (
        <TopNChart
          {...data}
          id="devices"
          key="devices"
          title="Dispositivos / Modelos"
          searchParamKey="deviceModel"
          defaultFormat="percentage"
          valueLabel="Sessões"
          renderRow={(item) => <Device name={item.name} />}
        />
      )}
    </TopNDataContainer>
  );
}
