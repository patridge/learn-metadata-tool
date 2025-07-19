import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import config from  './webpack.common.config'

const merged = merge<Configuration>(
    config,
    {
        mode: 'development',
        devtool: 'inline-source-map',
    }
);

export default merged;