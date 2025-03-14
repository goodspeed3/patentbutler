import React, {useState, useEffect} from 'react';
import './process.css'
import { Document, Page, pdfjs} from 'react-pdf'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

pdfjs.GlobalWorkerOptions.workerSrc = process.env.PUBLIC_URL + '/pdf.worker.min.js'

function PdfView (props) {
    let { fileData, showPriorArt, setShowPriorArt, panePosition, downloadedData, priorArtList, setPriorArtList, rejectionList, citationObj, setCitationObj } = props

    const [scale, setScale] = useState(1.0)
    const [fitScale, setFitScale] = useState(1.0)
    const [isScaleLocked, setIsScaleLocked] = useState(false)
    const [numPages, setNumPages] = useState(null)
    const [originalPageWidth, setOriginalPageWidth] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [paToLoad, setPaToLoad] = useState(0)
    const [pdfToLoad, setPdfToLoad] = useState(null)
    const [dragRect, setDragRect] = useState({
      x: 0,
      y: 0,
      width: 0,
      height: 0
    })
    const [showCitationDiv, setShowCitationDiv] = useState(false)
    const [didFinishRenderingPage, setDidFinishRenderingPage] = useState(false)
    const [selectedCitation, setSelectedCitation] = useState('')

    useEffect(() => {
      setCitationObj(c => {
        if (fileData && (fileData.computerProcessingTime || fileData.finishedProcessingTime) && Object.keys(c).length === 0) { //prefill!
          var prefilledCitationObj = {}
          if (!fileData.priorArtList) return prefilledCitationObj
          for (var a=0; a<fileData.priorArtList.length; a++) {
            let pa = fileData.priorArtList[a]
            prefilledCitationObj[pa.abbreviation] = pa.citationList
          }
          return prefilledCitationObj
        }
        //copy citations over
        var newCitationList=[]
        for (var i=0; i<rejectionList.length; i++) {
          const rejection = rejectionList[i]
          if (!rejection.claimArgumentList) continue
          for (var j=0; j<rejection.claimArgumentList.length; j++) {
            const claimArgument = rejection.claimArgumentList[j]
            if (!claimArgument.citationList) continue
            for (var k=0; k<claimArgument.citationList.length; k++) {
              const citationObj = claimArgument.citationList[k]
              
              let preExistingData = c[citationObj.abbreviation]
              var boundingBoxes = [];
              if (preExistingData) {
                for (var x = 0; x<preExistingData.length; x++) {
                  var preExistingCitation = preExistingData[x]
                  if (preExistingCitation.citation === citationObj.citation) {
                    boundingBoxes = preExistingCitation.boundingBoxes
                  }
                }
              }
              var newObj = {
                ...citationObj,
                boundingBoxes: boundingBoxes
              }
              newCitationList.push(newObj)
            }
          }
        }

        if (newCitationList.length === 0) return c
        var newCitationObj = {}
        //clear citationObj 
        for (i=0; i<newCitationList.length; i++) {
          const co = newCitationList[i]
          if (!co.abbreviation) continue
          newCitationObj[co.abbreviation] = []
        }

        let keyObj = Object.keys(newCitationObj) 
        for (i=0; i<keyObj.length; i++) {
          const abbreviation = keyObj[i]
          const citList = newCitationObj[abbreviation]
          for (j=0; j<newCitationList.length; j++) {
            const co = newCitationList[j]
            if (co.abbreviation === abbreviation) {
              //only add to list if it doesn't already exist
              let tCit = co.citation
              if (!citList.some(o => o.citation === tCit )) {
                // delete co.publicationNumber //don't need it anymore
                citList.push(co)
              }
            }
          }
          //sort the citations
          newCitationObj[abbreviation].sort((first, second) => {
            let firstNum = first.citation.match(/^[^\d]*(\d+)/)
            let secondNum = second.citation.match(/^[^\d]*(\d+)/)
            if (!firstNum && !secondNum) {
              return (second.citation < first.citation) ? 1 : -1 //neither contain numbers, so return alphabetically (abstract should be at the top)
            }
            if (!firstNum) return -1
            if (!secondNum) return 1

            let comparison = (parseInt(secondNum[1]) < parseInt(firstNum[1])) ? 1 : -1
            if (first.citation.toLowerCase().includes("fig") || second.citation.toLowerCase().includes("fig")) {
              if (first.citation.toLowerCase().includes("fig") && second.citation.toLowerCase().includes("fig")) {
                return comparison
              }
              if (first.citation.toLowerCase().includes("fig")) {
                //first citation has fig and second doesn't
                return -1
              }
              if (second.citation.toLowerCase().includes("fig")) {
                //second citation has fig and first doesn't
                return 1
              }
            }
            // console.log(`comparing ${firstNum[1]} and ${secondNum[1]}, returning ${comparison}`)
            return comparison
          })
        }

        return newCitationObj

      })
    }, [rejectionList, setCitationObj, fileData, setPriorArtList])
    useEffect(() => {
      if (!citationObj) return
      setPriorArtList(pal => {
        let abbrevs = Object.keys(citationObj) 
        if (abbrevs.length === 0) return pal
        for (const pa of pal) {
          if (!abbrevs.includes(pa.abbreviation)) {
            pa.citationList = [] //if the citation obj doesn't have any citaitons to this PA, then citationList should be an empty
            continue
          }
          for (var i=0; i<abbrevs.length; i++) {
            let abbrev = abbrevs[i]
            let citationList = citationObj[abbrev]
            if (pa.abbreviation === abbrev) {
              pa.citationList = citationList
            }
          }  
        }
        return pal
      })
    }, [citationObj, setPriorArtList])

    useEffect(() => {
        if (!isScaleLocked && originalPageWidth != null) {
            //this is needed for when user drags pane
            const parentDiv = document.querySelector('#PAView')
            let pageScale = parentDiv.clientWidth / originalPageWidth

            //only update scale if user did not zoom in or out
            setScale(pageScale)
            setFitScale(pageScale)
          }    
    }, [isScaleLocked, originalPageWidth, panePosition])

    useEffect(() => {
        if (showPriorArt && priorArtList.length > 0) {
            setPdfToLoad(priorArtList[paToLoad].cloudUrl)
        } else {
            setPdfToLoad(downloadedData)
        }
      }, [showPriorArt, paToLoad, pdfToLoad,downloadedData, priorArtList])

    const removeTextLayerOffset = () => {
        const textLayers = document.querySelectorAll(".react-pdf__Page__textContent");
          textLayers.forEach(layer => {
            const { style } = layer;
            style.top = "0";
            style.left = "0";
            style.transform = "";
        });
      }
      const previousPage = () => changePage(-1);
      const nextPage = () => changePage(1);
      const changePage = offset => {
        setDidFinishRenderingPage(false)
        setPageNumber(pageNumber + offset)
      };
    
      const zoomIn = () => changeZoom(0.25);
      const zoomOut = () => changeZoom(-0.25);
      const changeZoom = offset => {
        if (scale+offset > fitScale) {
            setIsScaleLocked(true)
        } else {
          setIsScaleLocked(false)
        }
        setScale(scale+offset)
        setDidFinishRenderingPage(false)
      }

      const handlePageEntry = (event) => {
        let pageNo = parseInt(event.target.value)
        if ( isNaN(pageNo) || pageNo > numPages || pageNo <= 0) {
          
        } else {
            setPageNumber(pageNo)
            setDidFinishRenderingPage(false)
        }
      }
      const onDocumentLoadSuccess = (document) => {
        const { numPages } = document;
        setNumPages(numPages)
      };
    
      const onPageLoad = (page) => {
        const parentDiv = document.querySelector('#PAView')
        let pageScale = parentDiv.clientWidth / page.originalWidth
        // console.log("pagescale: " + pageScale + " parentDiv width: " + parentDiv.clientWidth)
        if (originalPageWidth == null || (scale !== pageScale && !isScaleLocked)) {
            setScale(pageScale)
            setFitScale(pageScale)
            setOriginalPageWidth(page.originalWidth)
        }
      }
      const onRenderSuccessHandler = () => {
        setDidFinishRenderingPage(true)
        removeTextLayerOffset()
      }
      const getCitationToShow = () => {
        const citObj = citationObj[priorArtList[paToLoad].abbreviation].find((e) =>  e.boundingBoxes.length === 0)
        if (citObj) {
          return citObj.citation
        }
      }
      const handleFigRange = (e) => {
        let figPageNo = e.target.value
        let figPageType = e.target.name

        var selectedPa = priorArtList[paToLoad]
        if (!selectedPa.figureData) {
          selectedPa.figureData = { startPage: '2'}
        }
        if (figPageType === 'startPage') {
          selectedPa.figureData.startPage = figPageNo
        } else if (figPageType === 'endPage') {
          selectedPa.figureData.endPage = figPageNo
        }

        setPriorArtList(JSON.parse(JSON.stringify(priorArtList)))
      }
      const toggleElements = () => {
          return (
            <span>
                <button type="button" disabled={!showPriorArt} onClick={() => setShowPriorArt(false)}>Office Action</button>
                <button type="button" disabled={showPriorArt || priorArtList.length === 0} onClick={() => {setPageNumber(1); setShowPriorArt(true)}}>Prior Art</button>
                {
                    priorArtList && priorArtList.length > 0 &&
                    <>
                        &nbsp; 
                        <select onChange={(e) => {setShowPriorArt(true); setPageNumber(1); setPaToLoad(parseInt(e.target.value))}}>
                {priorArtList.map((paFile, index) => <option key={paFile.id || paFile.filename} value={index}>{paFile.abbreviation} - {paFile.publicationNumber}</option>)}
                        </select>
                    </>
                }
                {
                  //select first option that does not have bounding boxes created
                  showPriorArt && citationObj && citationObj[priorArtList[paToLoad].abbreviation] && 
                  <select readOnly value={getCitationToShow()}>
                    {
                      citationObj[priorArtList[paToLoad].abbreviation].map(c => 
                      <option value={c.citation} key={c.id}>{c.citation} {c.boundingBoxes.length > 0 && ' (DONE: p. ' + c.boundingBoxes[0].page + ')'}</option>
                      )
                    }                    
                  </select>
                }
                {showPriorArt && <div><label className='rotateInput'>
                <input
                name="shouldRotate"
                type="checkbox"
                checked={(priorArtList[paToLoad].rotatedPages && priorArtList[paToLoad].rotatedPages.indexOf(pageNumber) >= 0) || false}
                onChange={(e) => setRotate(e.target.checked)} />
                Rotate Page
              </label>
                <input className='figPage' type='text' name='startPage' placeholder='start fig' value={(priorArtList[paToLoad].figureData && priorArtList[paToLoad].figureData.startPage)|| 2} onChange={handleFigRange} />
                <input className='figPage' type='text' name='endPage' placeholder='end fig' value={(priorArtList[paToLoad].figureData && priorArtList[paToLoad].figureData.endPage) || ''} onChange={handleFigRange} />
              </div>
              }
                
            </span>
          )
      }
      const mouseDown = (e) => {
        if (!showPriorArt ) return;
        setShowCitationDiv(false)
        var rect = e.currentTarget.getBoundingClientRect();
        var x = e.clientX - rect.left; //x position within the element.
        var y = e.clientY - rect.top;  //y position within the element.
        setDragRect({
          ...dragRect,
          x: (100.0* x / rect.width).toFixed(2), //get percentage
          y: (100.0* y / rect.height).toFixed(2),
        })
      }
      const mouseUp = (e) => {
        if (!showPriorArt ) return;
        var rect = e.currentTarget.getBoundingClientRect();
        var x = e.clientX - rect.left; //x position within the element.
        var y = e.clientY - rect.top;  //y position within the element.
        // console.log({x: 100.0* x / rect.width, y: 100.0* y / rect.height})
        let width = ((100.0* x / rect.width).toFixed(2) - dragRect.x).toFixed(2) //get percentage
        let height = ((100.0* y / rect.height).toFixed(2) - dragRect.y).toFixed(2)
        setDragRect({
          ...dragRect,
          width:  width,
          height: height
        })
        if (width < 0.5 && height < 0.5) {
          // console.log('box too small, do not show')
          return
        }
        setShowCitationDiv(true)

      }      
      const selectCitation = (e) => {
        setSelectedCitation(e.target.value)
      }
      const saveCitation = (existingBbox = null) => {
        if (!selectedCitation) return
        var cList = citationObj[priorArtList[paToLoad].abbreviation]
        for (var i=0; i<cList.length; i++) {
          var cObj = cList[i]  
          if (cObj.citation === selectedCitation) {
            if (existingBbox) {
              cObj.boundingBoxes.push(existingBbox)
            } else {
              var bbox = {}
              bbox.page = pageNumber
              bbox.boundingBox = dragRect
              cObj.boundingBoxes.push(bbox)  
            }
            break;
          }
        }
          
        setCitationObj({...citationObj})
        setShowCitationDiv(false)
      }
      const showCitationDivElements = () => {
        if (!showPriorArt || !showCitationDiv || priorArtList.length === 0 || !citationObj || !citationObj[priorArtList[paToLoad].abbreviation]) {
          return
        }

        const pdfDiv = document.querySelector('#pdfDiv')
    
        if (!pdfDiv) {
          return
        }
        var customWidth = dragRect.width
        var customHeight = dragRect.height
        // if (customWidth <1 || customHeight <1) {
        //   customWidth = 25
        //   customHeight = 15
        // } 
        if (true) {
          var styleObj = {
            left: dragRect.x + '%',
            top: dragRect.y + '%',
            width: customWidth + '%',
            height: customHeight + '%',
            borderColor: 'rgb(255,66,65,1)',
            borderStyle: 'solid'
          }
          } else {
          var styleObj = {
            left: dragRect.x + '%',
            top: dragRect.y + '%',
            width: customWidth + '%',
            height: customHeight + '%',
            backgroundColor: 'rgb(255,66,65,0.15)',
          }
          }

        var dimensions = {}
        dimensions.zIndex = "99" //this should be on top
        if (!isScaleLocked) {
          dimensions.width = pdfDiv.clientWidth
          dimensions.height = pdfDiv.clientHeight
        } else {
          dimensions.width = pdfDiv.scrollWidth
          dimensions.height = pdfDiv.scrollHeight
    
        }

        return <div className='overlay' style={dimensions}><div style={styleObj} className='citationDiv' onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()}>
          <Form style={{padding: "1rem"}}>
          <Form.Group>
            <Form.Control size='sm' as="select" value={selectedCitation} onChange={selectCitation}>
              <option value=''>--</option>
              {
                citationObj[priorArtList[paToLoad].abbreviation].map(c => 
                <option value={c.citation} key={c.id}>{c.citation} {c.boundingBoxes.length > 0 && ' -- p. ' + c.boundingBoxes[0].page}</option>
                )
              }
            </Form.Control>
          </Form.Group>
          <Form.Group>
            {/* disabled={dragRect.width <1 || dragRect.height <1 } */}
            <Button  variant="primary" size="sm" onClick={() => saveCitation()}>Save</Button>
            <Button style={{marginLeft: '0.1rem'}} variant="secondary" size="sm" onClick={() => setShowCitationDiv(false)}>Close</Button>
          </Form.Group>

          </Form>
        </div></div>
      }
      const removeOverlay = (id, coordinateString) => {
        var citationList = citationObj[priorArtList[paToLoad].abbreviation]
        for (var i=0; i<citationList.length; i++) {
          var citObj = citationList[i]
          for (var j=0 ;j<citObj.boundingBoxes.length ;j++) {
            var cobb = citObj.boundingBoxes[j]
            var objCoord = cobb.boundingBox.y + '%-' + cobb.boundingBox.x + '%-' + cobb.boundingBox.width + '%-' + cobb.boundingBox.height + '%'
            if (citObj.id === id && objCoord === coordinateString) {
              citObj.boundingBoxes.splice(j, 1)
            }  
          }
        }
        setCitationObj({...citationObj})
      }
      const combineOverlay = (id, coordinateString) => {
        var citationList = citationObj[priorArtList[paToLoad].abbreviation]
        var thisBoundingBox;
        for (var i=0; i<citationList.length; i++) {
          var citObj = citationList[i]
          for (var j=0 ;j<citObj.boundingBoxes.length ;j++) {
            var cobb = citObj.boundingBoxes[j]
            var objCoord = cobb.boundingBox.y + '%-' + cobb.boundingBox.x + '%-' + cobb.boundingBox.width + '%-' + cobb.boundingBox.height + '%'
            if (citObj.id === id && objCoord === coordinateString) {
              thisBoundingBox = cobb;
              break;
            }  
          }
        }
        saveCitation(thisBoundingBox)
      }
      const setRotate = (checkValue) => {
        var pa = priorArtList[paToLoad]
        if (!pa.rotatedPages) {
          pa.rotatedPages = []
        }
        //if page doesn't exist and it's checked
        if (pa.rotatedPages.indexOf(pageNumber) === -1 && checkValue) {
          pa.rotatedPages.push(pageNumber)
        } else if (pa.rotatedPages.indexOf(pageNumber) > -1 && !checkValue) {
          //if page exists and it's not checked
          pa.rotatedPages.splice(pa.rotatedPages.indexOf(pageNumber), 1)
        }

        setPriorArtList([...priorArtList])

      }

      const generateOverlay = () => {
        if (!showPriorArt || priorArtList.length === 0 || !citationObj || !citationObj[priorArtList[paToLoad].abbreviation] || !didFinishRenderingPage) return
        const pdfDiv = document.querySelector('#pdfDiv')
        var styleArray = []
        var citationList = citationObj[priorArtList[paToLoad].abbreviation]
        for (var i=0; i<citationList.length; i++) {
          let citationBox = citationList[i]
          for (var j=0; j<citationBox.boundingBoxes.length; j++) {
            let citationBoxIndividual = citationBox.boundingBoxes[j]
            if (citationBoxIndividual.page !== pageNumber) {
              continue;
            }
            var styleObj = {}
            styleObj.id=citationBox.id
            styleObj.idName=""
            styleObj.citation=citationBox.citation
            styleObj.position = "absolute"
            styleObj.top = citationBoxIndividual.boundingBox.y + "%"
            styleObj.left = citationBoxIndividual.boundingBox.x + "%"
            styleObj.width = citationBoxIndividual.boundingBox.width + "%"
            styleObj.height = citationBoxIndividual.boundingBox.height + "%"
            if (true) {
               styleObj.borderStyle = "solid"
               styleObj.borderColor = "rgb(80,220,100, 1)"
            } else {
              styleObj.backgroundColor = "rgb(80,220,100, 0.15)"
            }
            // styleObj.zIndex= "10"
            styleArray.push(styleObj)
  
          }
        }
        var dimensions = {}
        dimensions.zIndex="10"
        if (!isScaleLocked) {
          dimensions.width = pdfDiv.clientWidth
          dimensions.height = pdfDiv.clientHeight
        } else {
          dimensions.width = pdfDiv.scrollWidth
          dimensions.height = pdfDiv.scrollHeight
    
        }
        
        return <div className='overlay' style={dimensions} >
          {
            styleArray.map((styleObj, i) =>  (
              <div id={styleObj.idName} style={styleObj} key={i + styleObj.top + '-' + styleObj.left + '-' + styleObj.width + '-' + styleObj.height}>
                <select value={selectedCitation} onChange={selectCitation} style={{marginLeft: '1rem', marginTop: '0.5rem', fontSize: '13px'}} >
              <option value=''>--</option>
              {
                citationObj[priorArtList[paToLoad].abbreviation].map(c => 
                <option value={c.citation} key={c.id}>{c.citation} {c.boundingBoxes.length > 0 && ' -- p. ' + c.boundingBoxes[0].page}</option>
                )
              }
            </select>
            <button className="noselect" style={{marginLeft: '1rem', fontSize: '13px'}} onClick={(e) => combineOverlay(styleObj.id, styleObj.top + '-' + styleObj.left + '-' + styleObj.width + '-' + styleObj.height)}>Combine</button>
            <button className="noselect" style={{marginLeft: '1rem', marginTop: '0.3rem', fontSize: '13px'}} onClick={(e) => removeOverlay(styleObj.id, styleObj.top + '-' + styleObj.left + '-' + styleObj.width + '-' + styleObj.height)}>Remove {styleObj.citation}</button>

              </div>
            ))
          }
        </div>
      }

      const showText = () => {
        if (showPriorArt || !fileData.textAnnotations) return
        const textAnnotations = JSON.parse(fileData.textAnnotations)
        return <div>{textAnnotations[pageNumber]}</div>
      }

    return (
        <div id="PAView" className="PAView">
        <div className='subviewHeader' id="subviewHeader">
        <div className="pageMetadata">{toggleElements()}</div>
          <div>
            
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={previousPage}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pageNumber >= numPages}
              onClick={nextPage}
            >
              Next
            </button>
            <button
              type="button"
              disabled={scale >= 3}
              onClick={zoomIn}
            >
              Bigger
            </button>
            <button
              type="button"
              disabled={scale <= 0.5}
              onClick={zoomOut}
            >
              Smaller
            </button>
            <input type="text" size={5} placeholder='Page #' onChange={handlePageEntry}/>
            
               &nbsp; Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}   
          </div>      
        </div> 
        {!didFinishRenderingPage && <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div> }
        <div style={showPriorArt ? {cursor: 'crosshair'}: {cursor: 'default'}} className='pdfDiv' id="pdfDiv" onMouseDown={mouseDown} onMouseUp={mouseUp}>
          <Document
            file={pdfToLoad}
            cMapUrl={process.env.PUBLIC_URL + '/cmaps/'}
            cMapPacked={true}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            <Page 
              pageNumber={pageNumber} 
              onLoadSuccess={onPageLoad}
              scale={scale}
              onRenderSuccess={onRenderSuccessHandler}

              // customTextRenderer={this.makeTextRenderer("0030")}
            />
          </Document>    
          {generateOverlay()}      
          {showCitationDivElements()}    
        </div>
        <div className='textDiv'>
          {showText()}
        </div>
    </div>
    )
}

export default PdfView;
