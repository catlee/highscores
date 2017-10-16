function numberWithCommas(x) {
    return parseInt(x, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(d) {
    let x = new Date(d);
    return x.toLocaleString();
}

async function get_scores() {
    let response = await fetch("https://sql.telemetry.mozilla.org/api/queries/47423/results.json?api_key=WKtQzeAXITaZl2ZDfPKlwrWyccAbiLhXafLxKV5G");
    let responseJson = await response.json();
    let rows_by_author = {};
    let raw_rows = responseJson.query_result.data.rows;
    for (var i = 0; i < raw_rows.length; ++i) {
        let row = raw_rows[i];
        if (!rows_by_author.hasOwnProperty(row.author)) {
            rows_by_author[row.author] = {
                author: row.author,
                elapsed: 0,
                jobs: 0,
            }
        }
        rows_by_author[row.author].elapsed += row.elapsed
        rows_by_author[row.author].jobs += row.jobs
    }
    let rows = new Array();
    for (var author in rows_by_author) {
        var row = rows_by_author[author];
        rows.push(row);
    }
    rows = rows.sort(function(a, b) {
        if (a.elapsed > b.elapsed) {
            return -1;
        } else {
            return 1;
        }
    })
    return {
        rows: rows,
        queryTime: responseJson.query_result.retrieved_at,
    }
}

class UserRow extends React.Component {
    render() {
        return (
            <div className="row">
                <span className="user">{this.props.author}</span>
                <span className="hours">{numberWithCommas(this.props.hours)}</span>
                <span className="jobs">{numberWithCommas(this.props.jobs)}</span>
            </div>
        );
    }
}

class HighscoresTable extends React.Component {
    constructor() {
        super();
        this.state = {
            rows: [],
            queryTime: new Date(),
        };
    }

    renderRows() {
        let rows = this.state.rows.map(row => {
            return <UserRow key={row.author} author={row.author} hours={row.elapsed / 3600} jobs={row.jobs} />
        });
        return rows;
    }

    render() {
        return (
            <div>
            <div id="scores">
                <div className="row">
                    <span className="user">User</span>
                    <span className="hours">Hours</span>
                    <span className="jobs">Jobs</span>
                </div>
                {this.renderRows()}
            </div>
            <div id="footer">
            Report generated at {formatDate(this.state.queryTime)} for try pushes in the previous 7 days.
            </div>
            </div>
        );
    }

    async componentDidMount() {
        let result = await get_scores();
        this.setState({
            rows: result.rows,
            queryTime: result.queryTime,
        });
    }
}

ReactDOM.render(
    (
        <div>
        <div id="title">Try High Scores</div>
        <HighscoresTable />
        </div>
    ),
    document.getElementById('root')
);
