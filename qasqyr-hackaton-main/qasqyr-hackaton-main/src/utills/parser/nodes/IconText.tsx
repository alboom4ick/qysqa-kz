// @ts-ignore
import React, {forwardRef} from "react";
import {IconText as IconTextType} from "../types";
import {getStylesFromBaseNode} from "../lib";
import {parser} from "../parser";
import {Flex} from "antd";

interface Props {
    obj: IconTextType;
}

export const IconText = forwardRef<HTMLDivElement, Props>(({obj}, ref) => {
    const style: React.CSSProperties = {
        ...(getStylesFromBaseNode(obj)),
    };

    return (
        <Flex ref={ref} style={style} vertical={false} gap={4}>
            {obj.icon}
            {parser(obj.text)}
        </Flex>
    );
});

IconText.displayName = "IconText";
