import React, {useState, useEffect, useRef } from 'react';
import './FigureView.css'
import { Document, Page, pdfjs} from 'react-pdf'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

import LazyLoad from 'react-lazyload';

pdfjs.GlobalWorkerOptions.workerSrc = process.env.PUBLIC_URL + '/pdf.worker.min.js'

function FigureView (props) {

    const [scale, setScale] = useState(1.0)
    // const [fitScale, setFitScale] = useState(1.0)
    // const [isScaleLocked, setIsScaleLocked] = useState(false)
    // const [numPages, setNumPages] = useState(null)
    const [originalPageWidth, setOriginalPageWidth] = useState(0)
    const [originalPageHeight, setOriginalPageHeight] = useState(0)
    const [pageNumber, setPageNumber] = useState(2)
    const [rotation, setRotation] = useState(0)
    const [priorArtFigures, setPriorArtFigures] = useState({})
    const [didFinishRenderingPage, setDidFinishRenderingPage] = useState(false)
    const [figureTrayWidth, setFigureTrayWidth] = useState(0)
    const [miniFigHeight, setMiniFigHeight] = useState(0)

    const pdfDivRef = useRef(null)
    useEffect(() => {

        setPriorArtFigures(props.paForFigs)
        setPageNumber(2)
        if (!props.paForFigs.rotatedPages) {
            setRotation(0)
        } else {
            setRotation(props.paForFigs.rotatedPages.indexOf(pageNumber) > -1 ? 90 : 0)
        }
    }, [props.paForFigs])
    useEffect(() => {
        if (pdfDivRef.current) 
            setMiniFigHeight(pdfDivRef.current.clientHeight)
    })
    
    useEffect(() => {
        setRotation((props.paForFigs.rotatedPages && props.paForFigs.rotatedPages.indexOf(pageNumber)) > -1 ? 90 : 0)
    }, [pageNumber])

    useEffect(() => {
        //this is needed for when user drags pane
        const parentDiv = document.querySelector('#PAMini')
        var pageScale = parentDiv.clientWidth / originalPageWidth
        if (rotation === 90 || rotation === 270 ) {
          pageScale = parentDiv.clientWidth / originalPageHeight
        }
        setFigureTrayWidth(parentDiv.clientWidth)

        setScale(pageScale)
    }, [props.panePosition])
    
    const onDocumentLoadSuccess = (document) => {
        // const { numPages } = document;
        // setNumPages(numPages)
    };
    const removeTextLayerOffset = () => {

        const textLayers = document.querySelectorAll(".react-pdf__Page__textContent");
          textLayers.forEach(layer => {
            const { style } = layer;
            style.top = "0";
            style.left = "0";
            style.transform = "";
        });
      }
    const onPageLoad = (page) => {
        setDidFinishRenderingPage(true)
        const parentDiv = document.querySelector('#PAMini')
        var pageScale = parentDiv.clientWidth / page.originalWidth
        if (rotation === 90 ||  rotation === 270 ) {
          pageScale = parentDiv.clientWidth / page.originalHeight
        }
        // console.log("pagescale: " + pageScale + " parentDiv width: " + parentDiv.clientWidth)
        if (scale !== pageScale) {
            setScale(pageScale)
            setOriginalPageHeight(page.originalHeight)
            setOriginalPageWidth(page.originalWidth)
            setFigureTrayWidth(parentDiv.clientWidth)
        }
      }
        
    const onRenderSuccessHandler = () => {
        removeTextLayerOffset()
    }
    const transformCoord = (box) => {
        switch (rotation % 360) {
          case 90:
            return {x: (100.0 -box.y - box.height).toFixed(2),
              y: box.x,
              width: box.height,
              height: box.width
            }
          case 180:
            return {x: (100 - box.x - box.width).toFixed(2),
              y: (100.0 - box.y - box.height).toFixed(2),
              width: box.width,
              height: box.height
            }
          case 270:
            return {x: box.y,
              y: (100 - box.x - box.width).toFixed(2),
              width: box.height,
              height: box.width
            }        
          case 0:
          default:
            return {x: box.x,
              y: box.y,
              width: box.width,
              height: box.height
            }
        }
      }
    
    const generateOverlay = () => {
        const pdfDiv = document.querySelector("#pdfMiniDiv")
        if (!didFinishRenderingPage || !pdfDiv) {
          return
        }

        var styleArray = []
        for (var i=0; i<priorArtFigures.citationList.length; i++) {
          let citationBox = priorArtFigures.citationList[i]
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
            var transformedCoord = transformCoord(citationBoxIndividual.boundingBox)
    
            styleObj.top = transformedCoord.y + "%"
            styleObj.left = transformedCoord.x + "%"
            styleObj.width = transformedCoord.width + "%"
            styleObj.height = transformedCoord.height + "%"
            styleObj.backgroundColor = "#FFE18F"
            styleObj.opacity = "0.3"
            styleObj.zIndex= "10"
            styleArray.push(styleObj)
    
          }
        }
    
        
        var dimensions = {}
        dimensions.width = figureTrayWidth
        dimensions.height = miniFigHeight
        // dimensions.width = pdfDiv.clientWidth
        // dimensions.height = pdfDiv.clientHeight
    //   console.log(`pdfDiv width: ${dimensions.width}, pdfDiv height: ${dimensions.height}`)

      return <div className='overlayFigs' style={dimensions}>
          {
            styleArray.map((styleObj, i) =>  (
              <div id={styleObj.idName} style={styleObj} key={i + styleObj.top + '-' + styleObj.left + '-' + styleObj.width + '-' + styleObj.height}></div>
            ))
          }
        </div>        
    }

    const pageContainesCites = (figPage) => {
        let citationList = priorArtFigures.citationList;
        for (let citation of citationList) {
            for (let boundingBox of citation.boundingBoxes) {
                if (parseInt(boundingBox.page) === figPage) {
                    return true
                }
            }
        }
        return false
    }

    
    const generateTrayElements = () => {
        if (!priorArtFigures.figureData) return
        var elements = [];
        for (var i=parseInt(priorArtFigures.figureData.startPage); i<= parseInt(priorArtFigures.figureData.endPage); i++) {
            let figPage = i;
            var figStyle = {};
            if (figPage === pageNumber) {
                figStyle = {position: "absolute", top: "0", width: "100%", height: "100%", border: "2px solid", zIndex: 5};
            } else if (pageContainesCites(figPage)) {
                figStyle = {position: "absolute", top: "0", width: "100%", height: "100%", border: "2px dotted", zIndex: 5};
            }
            elements.push(
                <div className="smallFig" key={`tray_${figPage}`}  onClick={() => setPageNumber(figPage)}>
                    <LazyLoad overflow height="200" once scrollContainer="#figureTray">
                        <Page                 
                            loading=""                                    
                            pageNumber={figPage} 
                            // onLoadSuccess={onPageLoad}
                            scale={0.2}
                            // onRenderSuccess={onRenderSuccessHandler}
                            rotate={(priorArtFigures.rotatedPages && priorArtFigures.rotatedPages.indexOf(figPage) > -1) ? 90 : 0}                                    
                            // customTextRenderer={this.makeTextRenderer("0030")}
                            >
                                {/* {console.log(figPage)} */}
                            <div style={figStyle} />
                            {/* <Button variant='outline-info' className='pageNumFigureTray'>{figPage}</Button> */}
                            </Page>                
                    </LazyLoad>
            </div>
            )
        }

        return elements


    }

    return <div id="PAMini" >
            {!didFinishRenderingPage && <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div> }

        <Button variant="outline-dark" className='closeButton' onClick={() => {
            props.handleFigs(false)
        }}>X</Button>
        <Document
            file={priorArtFigures.cloudUrl}
            cMapUrl={process.env.PUBLIC_URL + '/cmaps/'}
            cMapPacked={true}
            onLoadSuccess={onDocumentLoadSuccess}
            loading=""
          >
            <div className='mainFig' id="pdfMiniDiv" ref={pdfDivRef} >
            <Page 
              loading=""
              pageNumber={pageNumber} 
              onLoadSuccess={onPageLoad}
              scale={scale}
              onRenderSuccess={onRenderSuccessHandler}
              rotate={rotation}
            //   key={`${pageNumber}_${rotation}_${scale}`}
              // customTextRenderer={this.makeTextRenderer("0030")}
            />
            {generateOverlay()}
            </div>

            <div id="figureTray" className="figureTray" style={{width: figureTrayWidth}}>

                {
                    generateTrayElements()
                }
            </div>
        </Document>

    </div>
}


export default FigureView;
