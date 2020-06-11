import React, { useState, useEffect } from 'react';
import './IdsMatterView.css'
import { useParams } from 'react-router-dom';
import moment from 'moment'
import Table from 'react-bootstrap/Table'
import { HashLink as Link } from 'react-router-hash-link';
import Spinner from 'react-bootstrap/Spinner'
import Alert from 'react-bootstrap/Alert'
import Container from 'react-bootstrap/Container'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Button from 'react-bootstrap/Button'
// import Modal from 'react-bootstrap/Modal'
// import Form from 'react-bootstrap/Form'
import AuthApi from './AuthApi'
import { useAuth0 } from "../react-auth0-spa";
import Form from 'react-bootstrap/Form'
import { nanoid } from 'nanoid'
import Autosuggest from 'react-autosuggest';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'


function IdsMatterView() {
  const { getTokenSilently, user } = useAuth0();
  const [idsMatterData, setIdsMatterData] = useState(null)
  const [firmData, setFirmData] = useState(null)
  // const [pbUser, setPbUser] = useState({})
  const [matterSaved, setMatterSaved] = useState(true)
  const [suggestions, setSuggestions] = useState([])
  const [showIdsSyncSpinner, setShowIdsSyncSpinner] = useState(false)
  const [suggestedValue, setSuggestedValue] = useState('')
  let { attyDocket } = useParams();
  const [errorMsg, setErrorMsg] = useState('')
  const [validated, setValidated] = useState(false);


  useEffect(() => {
    if (!user) {
      // no user yet
      return
    }
    var formData = new FormData();
    formData.append('userEmail', user.email);
    formData.append('attyDocket', decodeURIComponent(attyDocket));


    AuthApi('/api/idsMatter', getTokenSilently, formData)
    .then(res => {
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setErrorMsg('')
        // setPbUser(res.user)

        // console.log(res)
        let tempObj = removeEmptyRowsExceptOne(res.attyDocket)
        setIdsMatterData(tempObj)
        setFirmData(filterFirmData(tempObj, res.firmData)) //used for autocomplete
      }

    })  
  }, [user, attyDocket]);
  useEffect(() => {
    if (!idsMatterData) return
    setMatterSaved(false)
    const timer = setTimeout(() => {
      //save to server
      var formData = new FormData();
      formData.append('userEmail', user.email);
      formData.append('idsMatterData', JSON.stringify(idsMatterData));
      // console.log(idsMatterData)
      AuthApi('/api/updateIdsMatter', getTokenSilently, formData)
      .then(res => {
        setMatterSaved(true)
      })  
    }, 1000); //every 1 sec 
    return () => clearTimeout(timer);
  }, [idsMatterData]);
  function filterFirmData(tempObj, firmDataObj) {
    var listOfSuggestionsToExclude = [decodeURIComponent(attyDocket)]
    if (tempObj.idsSync) {
      listOfSuggestionsToExclude = listOfSuggestionsToExclude.concat(tempObj.idsSync)
    }
    return firmDataObj.filter(e => !listOfSuggestionsToExclude.includes(e.attyDocket))
  }
  function removeEmptyRowsExceptOne(attyDocketObj) {
    //iterate over all entries of obj
    var keys = Object.keys(attyDocketObj.idsData)
    for (var key of keys) {
      attyDocketObj.idsData[key] = attyDocketObj.idsData[key].filter((e) => citeContainsText(e))
      attyDocketObj.idsData[key].push({}) //make sure there's at least one
    }
    return attyDocketObj
  }
  function updateMetadata(e) {
    const t = e.target
    switch(t.name) {
      case 'applicationNumber': 
        idsMatterData.metadata.applicationNumber = t.value
        break;
      case 'filingDate':
        idsMatterData.metadata.filingDate = t.value
        break;
      case 'inventor':
        idsMatterData.metadata.inventor = t.value
        break;
      case 'artUnit':
        idsMatterData.metadata.artUnit = t.value
        break;
      case 'examiner':
        idsMatterData.metadata.examiner = t.value
        break;
      case 'closed':
        idsMatterData.metadata.closed = t.checked
      break;
        default: 
        console.log('should not reach')
    }    
    setIdsMatterData(JSON.parse(JSON.stringify(idsMatterData)))

  }


  function metadataElements() {
    return <div>
      <Form.Row>
        <Form.Group as={Col}>
        <Form.Label><Link to="/ids">Home</Link> / Attorney Docket {matterSaved && <small style={{color: "green"}}> saved</small>}</Form.Label>
        <div><b style={{fontSize: "2rem"}}>{idsMatterData.attyDocket}</b> </div>
        </Form.Group>
        <Form.Group as={Col}>
        <Button variant="outline-info">Autofill using filed IDS</Button>
        </Form.Group>
      </Form.Row>
      <Form.Row>
      <Form.Group as={Col}>
        <Form.Label>Application Number</Form.Label>
        <Form.Control required type="text" name="applicationNumber" value={(idsMatterData.metadata.applicationNumber) ? idsMatterData.metadata.applicationNumber : ""} placeholder="12/345678" onChange={updateMetadata} />
      </Form.Group>
      <Form.Group as={Col}>
        <Form.Label>Filing Date</Form.Label>
        <Form.Control required type="text" name="filingDate" value={(idsMatterData.metadata.filingDate) ? idsMatterData.metadata.filingDate : ""} placeholder={new moment().format('MM-DD-YYYY')} onChange={updateMetadata} />
     </Form.Group>
      </Form.Row>
      <Form.Row>
      <Form.Group as={Col}>
        <Form.Label>Art Unit</Form.Label>
        <Form.Control type="text" name="artUnit" value={(idsMatterData.metadata.artUnit) ? idsMatterData.metadata.artUnit : ""} placeholder="3600" onChange={updateMetadata} />
      </Form.Group>
      <Form.Group as={Col}>
        <Form.Label>Examiner Name</Form.Label>
        <Form.Control type="text" name="examiner" value={(idsMatterData.metadata.examiner) ? idsMatterData.metadata.examiner : ""} placeholder="Washington" onChange={updateMetadata} />     
      </Form.Group>
      </Form.Row>
      <Form.Row>
      <Form.Group >
      <Form.Check type="checkbox" name="closed" label="Matter Closed" checked={(idsMatterData.metadata.closed) || false} onChange={updateMetadata} />
      </Form.Group>
      </Form.Row>
    </div>
  }

  function updateIds(e, index, idsType, isCheckbox = false) {
    const t = e.target
    if (isCheckbox) {
      idsMatterData.idsData[idsType][index][t.name] = t.checked
    } else {
      idsMatterData.idsData[idsType][index][t.name] = t.value
    }
    setIdsMatterData(JSON.parse(JSON.stringify(idsMatterData)))

  }  
  function citeContainsText(obj) {
    var keys = Object.keys(obj)
    for (var key of keys) {
      if (key !== "id" && key !== "src" && typeof obj[key] === 'string' && obj[key].length > 0) {
        return true
      }
    }
    return false
  }
  function generateUSPatentTable() {
    if (!idsMatterData) {
      return
    }
    return idsMatterData.idsData.usPatents.map((patent, i) => {
      if (Object.keys(patent).length === 0) {
        patent.id = nanoid()
        patent.usDocNumber = ""
        patent.usDocPubDate = ""
        patent.usDocName = ""
        patent.usDocNotes = ""
        patent.cited = false
        patent.src = attyDocket
      }

      return <tr key={patent.id}>
        <td><Form.Check aria-label="cited" name="cited" checked={patent.cited} onChange={(e) => updateIds(e, i, 'usPatents', true)}/></td>
        <td>
        <OverlayTrigger
            placement={'top'}
            overlay={
            <Tooltip id={`tooltip-top`}>
              {patent.src!==attyDocket ? <span>Imported from <strong>{patent.src}</strong></span> : <span>Added here</span>} <small>{patent.id}</small>
            </Tooltip>
            }
          >
          <div className="importTooltip" style={patent.src!==attyDocket ? {color: "#dfa700"} : {}}>{citeContainsText(patent) ? i+1 : ""}</div></OverlayTrigger>
        </td>
        <td><Form.Control type="text" name="usDocNumber" value={patent.usDocNumber} onChange={(e) => updateIds(e, i, 'usPatents')} /></td>
        <td><Form.Control type="text" name="usDocPubDate" value={patent.usDocPubDate} onChange={(e) => updateIds(e, i, 'usPatents')} /></td>
        <td><Form.Control type="text" name="usDocName" value={patent.usDocName} onChange={(e) => updateIds(e, i, 'usPatents')} /></td>
        <td><Form.Control type="text" name="usDocNotes" value={patent.usDocNotes} onChange={(e) => updateIds(e, i, 'usPatents')} /></td>
      </tr>

    })
  }
  function generateForeignPatentTable() {
    if (!idsMatterData) {
      return
    }
    return idsMatterData.idsData.foreignPatents.map((patent, i) => {
      if (Object.keys(patent).length === 0) {
        patent.id = nanoid()
        patent.foreignDocNumber = ""
        patent.foreignDocPubDate = ""
        patent.foreignDocName = ""
        patent.foreignDocNotes = ""
        patent.translation = false
        patent.cited = false
        patent.src = attyDocket
      }

      return <tr key={patent.id}>
        <td><Form.Check type="checkbox" aria-label="cited" name="cited" checked={patent.cited} onChange={(e) => updateIds(e, i, 'foreignPatents', true)} /></td>
        <td>
        <OverlayTrigger
            placement={'top'}
            overlay={
            <Tooltip id={`tooltip-top`}>
              {patent.src!==attyDocket ? <span>Imported from <strong>{patent.src}</strong></span> : <span>Added here</span>}
            </Tooltip>
            }
          >
          <div className="importTooltip" style={patent.src!==attyDocket ? {color: "#dfa700"} : {}}>{citeContainsText(patent) ? i+1 : ""}</div></OverlayTrigger>          
        </td>
        <td><Form.Control type="text" name="foreignDocNumber" value={patent.foreignDocNumber} onChange={(e) => updateIds(e, i, 'foreignPatents')} /></td>
        <td><Form.Control type="text" name="foreignDocPubDate" value={patent.foreignDocPubDate} onChange={(e) => updateIds(e, i, 'foreignPatents')} /></td>
        <td><Form.Control type="text" name="foreignDocName" value={patent.foreignDocName} onChange={(e) => updateIds(e, i, 'foreignPatents')} /></td>
        <td><Form.Control type="text" name="foreignDocNotes" value={patent.foreignDocNotes} onChange={(e) => updateIds(e, i, 'foreignPatents')} /></td>
        <td><Form.Check type="checkbox" aria-label="foreign translation" name="translation" checked={patent.translation} onChange={(e) => updateIds(e, i, 'foreignPatents', true)} /></td>
      </tr>

    })
    
  }

  function generateNPLTable() {
    if (!idsMatterData) {
      return
    }
    return idsMatterData.idsData.nonPatentLiterature.map((npl, i) => {
      if (Object.keys(npl).length === 0) {
        npl.id = nanoid()
        npl.citation = ""
        npl.translation = false
        npl.cited = false
        npl.src = attyDocket
      }

      return <tr key={npl.id}>
        <td><Form.Check type="checkbox" aria-label="cited" name="cited" checked={npl.cited} onChange={(e) => updateIds(e, i, 'nonPatentLiterature', true)} /></td>
        <td>
        <OverlayTrigger
            placement={'top'}
            overlay={
            <Tooltip id={`tooltip-top`}>
              {npl.src && npl.src!==attyDocket ? <span>Imported from <strong>{npl.src}</strong></span> : <span>Added here</span>}
            </Tooltip>
            }
          >
          <div className="importTooltip" style={npl.src!==attyDocket ? {"color": "#dfa700"} : {}}>{citeContainsText(npl) ? i+1 : ""}</div></OverlayTrigger>          
        </td>
        <td><Form.Control type="text" name="citation" value={npl.citation} onChange={(e) => updateIds(e, i, 'nonPatentLiterature')} /></td>
        <td><Form.Check type="checkbox" aria-label="foreign translation" name="translation" checked={npl.translation} onChange={(e) => updateIds(e, i, 'nonPatentLiterature', true)} /></td>
      </tr>

    })

    
  }
  function addToTable(tableName) {
    idsMatterData.idsData[tableName].push({})
    setIdsMatterData(JSON.parse(JSON.stringify(idsMatterData)))

  }
  function citeListElements() {
    return <div className="idsTable">
      <Button variant="outline-secondary" style={{marginBottom: "1rem"}}>Import 892, ISR, or IDS</Button>
      <h4>US Patents</h4>
      <Table bordered hover >
        <thead>
          <tr>
            <th style={{width: "1%"}}>Cited</th>
            <th style={{width: "4%"}}>#</th>
            <th style={{width: "25%"}}>Document Number<br /><small className="text-muted">Number-Kind Code</small></th>
            <th style={{width: "20%"}}>Publication Date<br /><small className="text-muted">MM-DD-YYYY</small></th>
            <th style={{width: "25%"}}>Name of Patentee or Applicant of Cited Document</th>
            <th style={{width: "25%"}}>Pages, Columns, Lines, Where Relevant Passages or Relevant Figures Appear</th>
          </tr>
        </thead>
        <tbody>
          {generateUSPatentTable()}
        </tbody>
      </Table>
      <Button size="sm" variant="outline-info" onClick={() => addToTable("usPatents")}>Add</Button>
      <h4>Foreign Patents</h4>
      <Table bordered hover >
        <thead>
          <tr>
            <th style={{width: "1%"}}>Cited</th>
            <th style={{width: "4%"}}>#</th>
            <th style={{width: "25%"}}>Foreign Patent Document<br /><small className="text-muted">Country Code–Number–Kind Code</small></th>
            <th style={{width: "15%"}}>Publication Date<br /><small className="text-muted">MM-DD-YYYY</small></th>
            <th style={{width: "25%"}}>Name of Patentee or Applicant of Cited Document</th>
            <th style={{width: "25%"}}>Pages, Columns, Lines, Where Relevant Passages or Relevant Figures Appear</th>
            <th style={{width: "5%"}}>Translation</th>
          </tr>
        </thead>
        <tbody>
          {generateForeignPatentTable()}
        </tbody>
      </Table>      
      <Button size="sm" variant="outline-info" onClick={() => addToTable("foreignPatents")}>Add</Button>
      <h4>Non Patent Literature</h4>
      <Table bordered hover >
        <thead>
          <tr>
            <th style={{width: "1%"}}>Cited</th>
            <th style={{width: "4%"}}>#</th>
            <th style={{width: "90%"}}>Include name of the author (in CAPITAL LETTERS), title of the article (when appropriate), title of the item (book, magazine, journal, serial, symposium, catalog, etc.), date, page(s), volume-issue
number(s), publisher, city and/or country where published.</th>
            <th style={{width: "5%"}}>Translation</th>
          </tr>
        </thead>
        <tbody>
          {generateNPLTable()}
        </tbody>
      </Table>  
      <Button size="sm" variant="outline-info" onClick={() => addToTable("nonPatentLiterature")}>Add</Button>
    </div>

  }

  function buttonElements() {
    return <div className='buttonElements'>
      <Button variant="success" type="submit" disabled={!matterSaved}>Generate SB08</Button>
    </div>
  }

  const generateSb = (event) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
      return

    }

    setValidated(true);

    event.preventDefault()
    event.stopPropagation();

  };
  function getSuggestions(userInput) {
    const inputValue = userInput.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? [] : firmData.filter(attyDocketEntity =>
      attyDocketEntity.attyDocket.toLowerCase().slice(0, inputLength) === inputValue
    );
  
  }
  function onSuggestionsFetchRequested({value}) {
    setSuggestions(getSuggestions(value))
  }
  function onSuggestionsClearRequested() {
    setSuggestions([])
  }
  function getSuggestionValue(suggestion) {
    return suggestion.attyDocket
  }
  function renderSuggestion(suggestion) {
    return <span>{suggestion.attyDocket}</span>
  }
  function onSuggestionSelected(event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) {
    setShowIdsSyncSpinner(true)
    setFirmData(filterFirmData(idsMatterData, firmData))

    var formData = new FormData();
    formData.append('relatedAttyDocket', suggestionValue);
    formData.append('idsMatterData', JSON.stringify(idsMatterData));

    AuthApi('/api/addToDocketSync', getTokenSilently, formData)
    .then(res => {
      if (!res.error) {
        setShowIdsSyncSpinner(false)
        setIdsMatterData(res.attyDocket)
      }
    })

  }

  function onSuggestionChange(event, { newValue }) {
    setSuggestedValue(newValue)
  }

  function removeIdsSync (docketId) {
    setShowIdsSyncSpinner(true)

    var formData = new FormData();
    formData.append('relatedAttyDocket', docketId);
    formData.append('idsMatterData', JSON.stringify(idsMatterData));

    AuthApi('/api/removeFromDocketSync', getTokenSilently, formData)
    .then(res => {
      if (!res.error) {
        setShowIdsSyncSpinner(false)
        setIdsMatterData(res.attyDocket)
      }
    })


    firmData.push({attyDocket: docketId}) //re-add it to suggestion list
    setFirmData(firmData) 
  }
  function idsSyncElements() {
    return   <div className="idsDiv">
    <h5>IDS Sync {showIdsSyncSpinner && <Spinner animation="border" variant="info" size="sm" />}</h5>
    <div className='idsBody'>
      <p>Cross-cite all references for the following matters:<br/><small className='text-muted'>References of synced cases will be imported to <b>{decodeURIComponent(attyDocket)}</b>, and changes to <b>{decodeURIComponent(attyDocket)}</b> references will be propagated to the synced cases.</small></p>
      <ul>
        {idsMatterData.idsSync && 
          idsMatterData.idsSync.map(e => <li key={e}><Link to={`/ids/view/${encodeURIComponent(e)}`}>{e}</Link> <Button className="text-muted" variant="link" size="sm" onClick={() => removeIdsSync(e)}>Remove</Button></li>)
        }
      </ul>
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        onSuggestionSelected={onSuggestionSelected}
        inputProps={{
          placeholder: 'Enter a related attorney docket ID',
          value: suggestedValue,
          onChange: onSuggestionChange
        }}
      />
    </div>
    </div>
  }
  var elements = <></>;
  if (errorMsg !== '') {
    elements = <Alert variant='danger'>
        {errorMsg}  Go <a href="/ids">back</a>.
    </Alert> 
  } else if (!user || !idsMatterData) {
    elements = <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div>
  } else {
    elements = 
      <Container className="idsMatterBlock">
        <Form onSubmit={generateSb} validated={validated} >
        <Row>
        <Col md="6">
            {metadataElements()}
        </Col>
        <Col>
          {buttonElements()}
          {idsSyncElements()}
        </Col>
        </Row>
        <hr />
        <Row>
        {citeListElements()}
        </Row>
        </Form>
      </Container>    
  }
  return (
    <div>
      {elements}
    </div>
  )



}

export default IdsMatterView;
