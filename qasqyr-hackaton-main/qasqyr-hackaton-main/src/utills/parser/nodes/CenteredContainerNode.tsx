import { forwardRef } from 'react';
import { CenteredContainer } from '../types';
import { getStylesFromBaseNode } from "../lib";
import { parser } from "../parser";
import {message} from "antd";

interface Props {
    obj: CenteredContainer;
}

const CenteredContainerNode = forwardRef<HTMLDivElement, Props>(({ obj }, ref) => {
    const style: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        ...(getStylesFromBaseNode(obj)),
    };

    return (
        <div ref={ref} style={style} onClick={() => message.info("Скоро добавим возможность клика...")}>
            {parser(obj.childNode)}
        </div>
    );
});

CenteredContainerNode.displayName = "CenteredContainerNode";

export default CenteredContainerNode;
