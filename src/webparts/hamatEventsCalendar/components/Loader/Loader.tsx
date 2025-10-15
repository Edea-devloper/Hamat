import * as React from "react";
import styles from "./Loader.module.scss";

export interface ILoaderProps {
    visible: boolean; // control loader visibility
}

const Loader: React.FC<ILoaderProps> = ({ visible }) => {
    if (!visible) return null;

    return (
        <div className={styles.loaderOverlay}>
            <div className={styles.loader}></div>
        </div>
    );
};

export default Loader;
