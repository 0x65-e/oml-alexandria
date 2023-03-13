import { LayoutOptions } from "elkjs";
import { DefaultLayoutConfigurator } from "sprotty-elk/lib/elk-layout";
import { SGraph, SLabel, SModelIndex, SNode, SPort } from "sprotty-protocol";

export class OmlLayoutConfigurator extends DefaultLayoutConfigurator {
  protected override graphOptions(
    sgraph: SGraph,
    index: SModelIndex
  ): LayoutOptions {
    return {
      "org.eclipse.elk.direction": "UP",
      "org.eclipse.elk.spacing.nodeNode": "30.0",
      "org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers": "30.0",
      "org.eclipse.elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "org.eclipse.elk.layered.crossingMinimization.greedySwitch.type": "OFF",
    };
  }

  protected override nodeOptions(
    snode: SNode,
    index: SModelIndex
  ): LayoutOptions {
    return {
      "org.eclipse.elk.direction": "UP",
      "org.eclipse.elk.spacing.nodeNode": "100.0",
      "org.eclipse.elk.spacing.edgeNode": "30.0",
      "org.eclipse.elk.spacing.edgeEdge": "15.0",
      "org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers": "30.0",
      "org.eclipse.elk.layered.spacing.edgeEdgeBetweenLayers": "100.0",
      "org.eclipse.elk.padding": "[top=50,left=50,bottom=50,right=50]",
      "org.eclipse.elk.portConstraints": "FIXED_SIDE",
      "org.eclipse.elk.hierarchyHandling": "INCLUDE_CHILDREN",
    };
  }
  protected override labelOptions(
    slabel: SLabel,
    index: SModelIndex
  ): LayoutOptions | undefined {
    return {
      "org.eclipse.elk.font.size": "14",
    };
  }

  protected override portOptions(
    sport: SPort,
    index: SModelIndex
  ): LayoutOptions {
    return {
/*       "org.eclipse.elk.port.side": "EAST",
      "org.eclipse.elk.port.borderOffset": "3.0", */
    };
  }
}
