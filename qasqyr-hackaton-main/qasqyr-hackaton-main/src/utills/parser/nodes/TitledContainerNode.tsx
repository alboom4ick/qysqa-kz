import { TitledContainer } from "../types";
import { forwardRef } from "react";
import { parser } from "../parser";
import { getStylesFromBaseNode } from "../lib";
import {Flex} from "antd";

interface Props {
    obj: TitledContainer;
}

export const TitledContainerNode = forwardRef<HTMLDivElement, Props>(({ obj }, ref) => {
    const containerStyles = {
        ...(getStylesFromBaseNode(obj)),
    };

    return (
        <Flex ref={ref} vertical={true} gap={8} style={containerStyles}>
            {parser(obj.titleText)}
            {parser(obj.content)}
        </Flex>
    );
});

TitledContainerNode.displayName = "TitledContainerNode";

export default TitledContainerNode;
